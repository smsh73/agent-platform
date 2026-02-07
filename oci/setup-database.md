# OCI Database Setup Guide

이 가이드는 Agent Platform을 위한 OCI Database 설정 방법을 설명합니다.

## 옵션 1: PostgreSQL Database Service (권장)

현재 애플리케이션은 PostgreSQL + Prisma를 사용하므로 이 옵션이 가장 간단합니다.

### OCI Console에서 PostgreSQL Database 생성

1. **OCI Console 로그인**
   - https://cloud.oracle.com
   - Tenancy: ocislxai
   - Region: YNY (ap-chuncheon-1)

2. **PostgreSQL Database 생성**
   ```
   Navigation Menu > Databases > PostgreSQL Database Service > DB Systems
   → Create DB System
   ```

3. **설정**
   - **Name**: agent-platform-db
   - **Compartment**: 적절한 compartment 선택
   - **PostgreSQL Version**: 14 이상
   - **Shape**: VM.Standard.E4.Flex (1 OCPU, 16GB RAM)
   - **Storage**: 50GB (필요에 따라 조정)
   - **Network Configuration**:
     - VCN: 기존 VCN 선택 또는 새로 생성
     - Subnet: Public 또는 Private subnet
   - **Admin Credentials**:
     - Username: postgres
     - Password: [강력한 비밀번호 설정]

4. **보안 설정**
   - Security List에서 PostgreSQL 포트(5432) 허용
   - Private subnet 사용 시: Container Instance와 같은 VCN 사용

### 연결 정보

데이터베이스 생성 후 연결 정보를 저장:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@DB_HOST:5432/postgres?schema=public"
```

- `DB_HOST`: DB System의 Private IP (또는 Public IP)
- `YOUR_PASSWORD`: 설정한 admin 비밀번호

---

## 옵션 2: Autonomous Database (Oracle DB)

Autonomous Database는 Oracle Database이므로 Prisma 설정 변경이 필요합니다.

### ⚠️ 주의사항

이 옵션을 사용하려면:
1. Prisma schema를 Oracle DB 호환 형식으로 변경
2. `@prisma/client`를 Oracle용으로 설정
3. 일부 타입/기능 수정 필요

### OCI Console에서 Autonomous Database 생성

1. **Autonomous Database 생성**
   ```
   Navigation Menu > Databases > Autonomous Database
   → Create Autonomous Database
   ```

2. **설정**
   - **Display Name**: agent-platform-adb
   - **Workload Type**: Transaction Processing (ATP)
   - **Deployment Type**: Shared Infrastructure
   - **Database Version**: 19c 또는 21c
   - **OCPU**: 1
   - **Storage**: 20GB
   - **Auto Scaling**: Enabled
   - **Admin Password**: [강력한 비밀번호]
   - **Network Access**:
     - Secure access from everywhere (개발용)
     - 또는 Private endpoint only (프로덕션)

3. **Wallet 다운로드**
   - DB 생성 후 "DB Connection" 클릭
   - Wallet 다운로드 (인증서 파일)

### Prisma Schema 변경 (Oracle DB용)

```prisma
// schema.prisma - Oracle DB 버전
datasource db {
  provider = "oracle"
  url      = env("DATABASE_URL")
}

// 연결 문자열
DATABASE_URL="oracle://ADMIN:password@host:1521/servicename"
```

---

## 옵션 3: 컨테이너로 PostgreSQL 실행 (개발/테스트용)

빠른 테스트를 위해 Container Instance에 PostgreSQL을 함께 실행할 수 있습니다.

### Docker Compose 예시

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: yourpassword
      POSTGRES_DB: agentplatform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    image: ap-chuncheon-1.ocir.io/namespace/agent-platform:latest
    environment:
      DATABASE_URL: postgresql://postgres:yourpassword@postgres:5432/agentplatform
    depends_on:
      - postgres
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

---

## 권장사항

### 개발/스테이징 환경
- **PostgreSQL Database Service** (저비용, 관리 편의성)
- 또는 Container로 PostgreSQL 실행

### 프로덕션 환경
- **PostgreSQL Database Service** with:
  - High Availability 설정
  - Automatic Backups
  - Private Subnet 사용
  - Read Replicas (필요시)

### 데이터베이스 마이그레이션

데이터베이스 생성 후:

```bash
# 1. DATABASE_URL 환경변수 설정
export DATABASE_URL="postgresql://postgres:password@host:5432/postgres"

# 2. Prisma 마이그레이션 실행
npx prisma migrate deploy

# 3. 초기 데이터 seeding (선택)
npx prisma db seed
```

---

## 다음 단계

데이터베이스 설정 완료 후:
1. `DATABASE_URL` 저장
2. Container Instance 배포 스크립트에서 환경변수로 설정
3. `./oci/deploy-container.sh` 실행

---

## 문제 해결

### 연결 실패
- Security List에서 포트 5432 허용 확인
- VCN/Subnet이 Container Instance와 동일한지 확인
- Private IP 사용 시: 같은 VCN/Subnet 내에 있어야 함

### SSL 연결 오류
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 권한 오류
```sql
-- admin 사용자로 접속 후
CREATE DATABASE agentplatform;
GRANT ALL PRIVILEGES ON DATABASE agentplatform TO postgres;
```
