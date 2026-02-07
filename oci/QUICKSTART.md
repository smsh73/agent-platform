# 🚀 OCI 배포 빠른 시작 가이드

Agent Platform을 OCI에 배포하는 가장 빠른 방법입니다.

## 전체 배포 시간: 약 30-45분

---

## ✅ 체크리스트

배포 전 준비사항:

- [ ] Docker 설치됨
- [ ] OCI 계정 접근 가능
- [ ] Auth Token 생성 준비
- [ ] Database 선택 결정 (PostgreSQL 권장)

---

## 📝 5단계 배포 프로세스

### 1️⃣ OCI CLI 설정 (5분)

```bash
cd agent-platform
./oci/setup-oci.sh
```

**입력 정보**:
- User OCID: OCI Console > Identity > Users에서 확인
- Tenancy OCID: `ocid1.tenancy.oc1..aaaaaaaaqqvkziyie25od72fkzlr2nscaeczaqpvpkcsmbmzlnlke3ljspxq`
- Region: `ap-chuncheon-1`

**완료 후**:
- 생성된 public key를 OCI Console에 업로드
- Path: Identity & Security > Users > API Keys > Add API Key

---

### 2️⃣ Auth Token 생성 (2분)

OCI Console에서:
1. Identity & Security > Users > [your user]
2. Resources > Auth Tokens
3. Generate Token
4. **토큰 복사 후 안전하게 보관**

---

### 3️⃣ PostgreSQL Database 생성 (10분)

**OCI Console 경로**:
```
Databases > PostgreSQL Database Service > Create DB System
```

**설정**:
- Name: `agent-platform-db`
- Version: PostgreSQL 14+
- Shape: VM.Standard.E4.Flex (1 OCPU, 16GB)
- Storage: 50GB
- Admin Password: 강력한 비밀번호 설정

**완료 후**:
```bash
# 연결 문자열 저장
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@DB_PRIVATE_IP:5432/postgres?schema=public"
```

---

### 4️⃣ Docker 이미지 배포 (10-15분)

```bash
./oci/deploy-to-registry.sh
```

**입력 정보**:
- Username: `ocislxai/seungmin.lee@saltlux.com`
- Auth Token: 2단계에서 생성한 토큰

빌드 완료까지 대기...

---

### 5️⃣ Container Instance 배포 (5-10분)

```bash
./oci/deploy-container.sh
```

**환경 변수 입력**:

```bash
# 필수
DATABASE_URL="postgresql://..."              # 3단계에서 저장
NEXTAUTH_SECRET="$(openssl rand -base64 32)" # 자동 생성
NEXTAUTH_URL="http://PUBLIC_IP:3000"         # 나중에 업데이트
ENCRYPTION_KEY="$(openssl rand -hex 16)"     # 자동 생성

# 선택 (나중에 앱에서 설정 가능)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_AI_API_KEY=""
PERPLEXITY_API_KEY=""
```

**배포 완료!** 🎉

---

## 🌐 접속 확인

스크립트가 출력한 Public IP로 접속:

```bash
# Health check
curl http://PUBLIC_IP:3000/api/health

# 브라우저
open http://PUBLIC_IP:3000
```

---

## ⚠️ 자주 발생하는 문제

### Database 연결 실패

**증상**: Health check에서 database disconnected

**해결**:
1. Security List에서 5432 포트 허용
2. Container Instance와 Database가 같은 VCN에 있는지 확인
3. DATABASE_URL이 올바른지 확인

```bash
# Security List 확인
OCI Console > Networking > VCN > Security Lists
→ Ingress Rule: Source 10.0.0.0/16, Destination Port 5432
```

### 이미지 Pull 실패

**증상**: Container Instance가 시작되지 않음

**해결**:
```bash
# 1. 이미지가 올바르게 푸시되었는지 확인
oci artifacts container repository list \
  --compartment-id COMPARTMENT_ID

# 2. Repository가 Private인지 확인 및 권한 설정
```

### Public IP로 접속 안됨

**증상**: Connection timeout

**해결**:
```bash
# Security List에 Ingress Rule 추가
Source: 0.0.0.0/0
Destination Port: 3000
Protocol: TCP
```

---

## 🔄 업데이트 방법

코드 수정 후:

```bash
# 1. 새 이미지 빌드 및 푸시
./oci/deploy-to-registry.sh

# 2. Container Instance 재시작
oci container-instances container-instance delete \
  --container-instance-id CONTAINER_ID --force

./oci/deploy-container.sh
```

---

## 📊 예상 비용

**개발 환경** (권장 설정):
- Container Instance: CI.Standard.E4.Flex (1 OCPU, 8GB) ~ $30/월
- PostgreSQL DB: VM.Standard.E4.Flex (1 OCPU, 16GB) ~ $40/월
- Storage: 50GB ~ $5/월
- **총 예상: ~$75/월**

**프로덕션 환경**:
- Container Instance: CI.Standard.E4.Flex (2 OCPU, 16GB) ~ $60/월
- PostgreSQL DB: High Availability ~ $100/월
- Load Balancer ~ $20/월
- **총 예상: ~$180-250/월**

---

## 🎯 다음 단계

배포 완료 후:

1. **HTTPS 설정**
   - Load Balancer 생성
   - SSL 인증서 설정
   - 커스텀 도메인 연결

2. **모니터링**
   - OCI Logging 활성화
   - Alerting 설정

3. **백업**
   - Database 자동 백업 활성화
   - 정기 스냅샷 설정

4. **CI/CD**
   - GitHub Actions 설정
   - 자동 배포 파이프라인

---

## 📚 추가 리소스

- [상세 배포 가이드](./README.md)
- [Database 설정 가이드](./setup-database.md)
- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)

---

**문제 발생 시**:
1. 로그 확인: `oci logging-search search-logs ...`
2. README.md의 문제 해결 섹션 참조
3. OCI Support 문의

---

**배포 성공하셨나요? 축하합니다! 🎊**
