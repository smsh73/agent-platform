# OCI Deployment Guide for Agent Platform

이 가이드는 Agent Platform을 Oracle Cloud Infrastructure(OCI)에 배포하는 전체 과정을 설명합니다.

## 📋 목차

1. [사전 준비](#사전-준비)
2. [배포 단계](#배포-단계)
3. [환경 변수 설정](#환경-변수-설정)
4. [문제 해결](#문제-해결)
5. [유지보수](#유지보수)

---

## 🎯 사전 준비

### 필요한 정보

- **Tenancy OCID**: `ocid1.tenancy.oc1..aaaaaaaaqqvkziyie25od72fkzlr2nscaeczaqpvpkcsmbmzlnlke3ljspxq`
- **User**: `seungmin.lee@saltlux.com`
- **Region**: `ap-chuncheon-1` (YNY)
- **Tenancy Name**: `ocislxai`

### 로컬 환경 준비

1. **Docker 설치**
   - macOS: Docker Desktop for Mac
   - Linux: Docker Engine

2. **OCI CLI 설치** (스크립트가 자동으로 설치)
   ```bash
   # 또는 수동 설치:
   brew install oci-cli  # macOS
   ```

3. **필요한 권한**
   - Container Registry 읽기/쓰기
   - Container Instances 생성/관리
   - VCN 생성/관리 (필요시)
   - Database 생성/관리

---

## 🚀 배포 단계

### Step 1: OCI CLI 설정

```bash
cd /path/to/agent-platform
./oci/setup-oci.sh
```

프롬프트에 따라 다음 정보 입력:
- User OCID (OCI Console > Identity > Users에서 확인)
- Tenancy OCID (위 참조)
- Region: `ap-chuncheon-1`
- API Key: 자동 생성 또는 기존 키 사용

**중요**: 생성된 public key를 OCI Console에 업로드해야 합니다.
```
OCI Console > Identity & Security > Users > [your user] > API Keys > Add API Key
```

### Step 2: Auth Token 생성

Container Registry 인증을 위한 Auth Token이 필요합니다.

1. OCI Console로 이동
2. Identity & Security > Users > [your user]
3. Resources > Auth Tokens > Generate Token
4. Token 설명 입력 (예: "Container Registry Access")
5. **생성된 토큰을 안전하게 저장** (다시 볼 수 없음)

### Step 3: Database 설정

데이터베이스 옵션을 선택하고 설정합니다.

**권장: PostgreSQL Database Service**

```bash
# OCI Console에서 PostgreSQL Database 생성
# 자세한 내용은 oci/setup-database.md 참조
```

생성 후 연결 문자열 저장:
```
DATABASE_URL=postgresql://postgres:PASSWORD@DB_HOST:5432/postgres?schema=public
```

**대안: Autonomous Database**
- Oracle DB를 사용하려면 Prisma schema 변경 필요
- `oci/setup-database.md` 참조

### Step 4: Docker 이미지 빌드 및 푸시

```bash
./oci/deploy-to-registry.sh
```

프롬프트에 따라 입력:
- **Username**: `ocislxai/seungmin.lee@saltlux.com`
  - 형식: `<tenancy-name>/<username>`
  - Oracle Identity Cloud Service 사용 시: `<tenancy-name>/oracleidentitycloudservice/<username>`
- **Auth Token**: Step 2에서 생성한 토큰

스크립트 실행 내용:
1. Tenancy namespace 자동 감지
2. Container Registry에 repository 생성
3. Docker 이미지 빌드
4. 이미지를 OCIR에 푸시

### Step 5: Container Instance 배포

```bash
./oci/deploy-container.sh
```

스크립트가 다음을 수행합니다:
1. Compartment 정보 가져오기
2. VCN 및 Subnet 생성 또는 선택
3. 환경 변수 입력 요청
4. Container Instance 생성
5. Public IP 할당

**필요한 환경 변수**:
- `DATABASE_URL`: Step 3에서 얻은 연결 문자열
- `NEXTAUTH_SECRET`: 랜덤 문자열 (32자 이상)
  ```bash
  # 생성 방법:
  openssl rand -base64 32
  ```
- `NEXTAUTH_URL`: 앱 접속 URL (예: `http://PUBLIC_IP:3000`)
- `ENCRYPTION_KEY`: API 키 암호화용 (32자)
  ```bash
  openssl rand -hex 16
  ```
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc. (선택사항)

### Step 6: 배포 확인

```bash
# Container Instance 상태 확인
oci container-instances container-instance get \
  --container-instance-id <CONTAINER_INSTANCE_ID>

# 앱 접속
open http://<PUBLIC_IP>:3000

# Health check
curl http://<PUBLIC_IP>:3000/api/health
```

---

## ⚙️ 환경 변수 설정

### 필수 환경 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | NextAuth 세션 암호화 키 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 앱 공개 URL | `http://your-ip:3000` |
| `ENCRYPTION_KEY` | API 키 암호화 키 (32자) | `openssl rand -hex 16` |

### 선택 환경 변수 (앱 설정에서도 가능)

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 (fallback) |
| `ANTHROPIC_API_KEY` | Anthropic API 키 (fallback) |
| `GOOGLE_AI_API_KEY` | Google AI API 키 (fallback) |
| `PERPLEXITY_API_KEY` | Perplexity API 키 (fallback) |

**참고**: API 키는 앱 실행 후 Settings 페이지에서도 설정 가능합니다.

---

## 🔧 문제 해결

### Docker 로그인 실패

```
Error response from daemon: Get https://ap-chuncheon-1.ocir.io/v2/: unauthorized
```

**해결책**:
1. Auth Token이 올바른지 확인
2. Username 형식 확인: `tenancy-name/username`
3. Token이 활성화되어 있는지 OCI Console에서 확인

### Container Instance 시작 실패

```bash
# 로그 확인
oci logging-search search-logs \
  --search-query "search \"<compartment-id>\" | source='<container-instance-id>'"
```

**일반적인 원인**:
- DATABASE_URL 오류: 연결 문자열 확인
- 메모리 부족: Shape의 메모리 증가
- 이미지 pull 실패: Registry 권한 확인

### Database 연결 실패

1. **Security List 확인**
   ```
   OCI Console > Networking > Virtual Cloud Networks > [VCN] > Security Lists
   → Ingress Rules에 5432 포트 허용 확인
   ```

2. **같은 VCN/Subnet 사용 확인**
   - Container Instance와 Database가 같은 네트워크에 있어야 함

3. **연결 테스트**
   ```bash
   # Container에서 직접 테스트
   oci container-instances container exec \
     --container-instance-id <ID> \
     --container-name agent-platform-app \
     --command "psql $DATABASE_URL -c 'SELECT 1'"
   ```

### Public IP로 접속 불가

1. **Security List 확인**
   - Ingress Rule: `0.0.0.0/0` → TCP 3000

2. **애플리케이션 시작 확인**
   ```bash
   curl http://<PUBLIC_IP>:3000/api/health
   ```

---

## 🔄 유지보수

### 애플리케이션 업데이트

```bash
# 1. 코드 수정 후 새 이미지 빌드 및 푸시
./oci/deploy-to-registry.sh

# 2. 기존 Container Instance 삭제
oci container-instances container-instance delete \
  --container-instance-id <ID> \
  --force

# 3. 새 인스턴스 배포
./oci/deploy-container.sh
```

### 데이터베이스 마이그레이션

```bash
# 로컬에서 마이그레이션 파일 생성
npx prisma migrate dev --name add_new_feature

# Container에 적용 (자동)
# Dockerfile의 CMD가 자동으로 migrate deploy 실행
```

### 백업

**Database 백업**:
```bash
# PostgreSQL Database Service는 자동 백업 제공
# OCI Console > Databases > PostgreSQL > Backups
```

**수동 백업**:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 모니터링

**Container 로그**:
```bash
oci logging-search search-logs \
  --search-query "search \"<compartment-id>\" | source='<container-instance-id>'"
```

**Health Check**:
```bash
# Cron job으로 주기적 확인
*/5 * * * * curl -f http://<PUBLIC_IP>:3000/api/health || echo "Health check failed"
```

**리소스 사용량**:
```bash
oci container-instances container-instance get \
  --container-instance-id <ID> \
  --query 'data."lifecycle-state"'
```

---

## 📊 비용 최적화

### 개발 환경
- Shape: `CI.Standard.E4.Flex` (1 OCPU, 8GB)
- Database: PostgreSQL Shared (1 OCPU)
- 예상 비용: ~$50-100/월

### 프로덕션 환경
- Shape: `CI.Standard.E4.Flex` (2-4 OCPU, 16-32GB)
- Database: PostgreSQL with High Availability
- 예상 비용: ~$200-400/월

**비용 절감 팁**:
1. 개발 환경은 사용하지 않을 때 중지
2. Autonomous Database 대신 PostgreSQL 사용
3. Reserved Capacity 활용 (장기 사용 시)

---

## 🔐 보안 고려사항

1. **Private Subnet 사용** (프로덕션)
   - Load Balancer를 통한 접근
   - Database는 항상 Private Subnet

2. **Secrets Management**
   - OCI Vault 사용 권장
   - 환경 변수에 민감 정보 하드코딩 금지

3. **Network Security**
   - Security List로 필요한 포트만 허용
   - WAF (Web Application Firewall) 구성

4. **정기 업데이트**
   - 이미지 정기 재빌드 (보안 패치)
   - OCI 리소스 업데이트

---

## 📞 지원

문제 발생 시:
1. 로그 확인 (위 문제 해결 섹션 참조)
2. [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
3. [OCI Support](https://support.oracle.com)

---

## 다음 단계

- [ ] Load Balancer 설정 (프로덕션)
- [ ] HTTPS/SSL 인증서 설정
- [ ] 커스텀 도메인 연결
- [ ] CI/CD 파이프라인 구축 (GitHub Actions)
- [ ] 모니터링 대시보드 설정

---

**Last Updated**: 2026-02-07
