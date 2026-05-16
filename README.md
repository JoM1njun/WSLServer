## server(Directory) => Web or App Server
### controllers = DB Insert, Delete, Select etc Function (요청 & 응답 처리)
### routes = URL Connect (각 DB Controller Server.js와 연결)
### middlewear = Exception & Error Handling (예외처리 및 오류처리)
### utils = Public Function (공통 기능 함수)
<br><br>

## How To Use
### API Prefix
| API        | URL Prefix     | 설명                |
| ---------- | -------------- | ----------------- |
| Company    | `/company`     | 회사 정보 관리          |
| Branch     | `/branches`    | 지점 정보 관리          |
| Department | `/departments` | 부서 정보 관리          |
| Worker     | `/workers`     | 작업자 정보 관리         |
| Helmet     | `/helmets`     | 헬멧 정보 관리          |
| Sensor     | `/sensors`     | 센서 데이터 및 AI 예측 관리 |
<br>

### ex: https://서버URL/workers OR https://서버URL/workers/workerId
<br>

## Company API
### API List
| Method | URL                   | 설명          |
| ------ | --------------------- | ----------- |
| GET    | `/company`            | 전체 회사 목록 조회 |
| GET    | `/company/:companyId` | 특정 회사 조회    |
| POST   | `/company`            | 회사 추가       |
| DELETE | `/company/:companyId` | 회사 삭제       |

### 1. 전체 회사 목록 조회
GET /company

#### Response
{
  "success": true,
  "data": [
    {
      "ID": 1,
      "Company_Name": "ABC 회사",
      "Address": "대전광역시 ...",
      "Phone": "010-1234-5678"
    }
  ]
} <br><br>
### 2. 특정 회사 조회
GET /company/:companyId
#### ex: GET /company/1

#### Response
{
  "success": true,
  "data": {
    "ID": 1,
    "Company_Name": "ABC 회사",
    "Address": "대전광역시 ...",
    "Phone": "010-1234-5678"
  }
} <br><br>
### 3. 회사 추가
POST /company

#### Request Body
{
  "companyName": "ABC 회사",
  "address": "대전광역시 ...",
  "phone": "010-1234-5678"
}
#### Response
{
  "success": true,
  "message": "회사 정보 추가 성공"
} <br><br>
### 4. 회사 삭제
DELETE /company/:companyId
### ex: DELETE /company/1

### Response
{
  "success": true,
  "message": "회사 삭제 성공"
} <br><br><br>

## Branch API
### API List
| Method | URL                   | 설명          |
| ------ | --------------------- | ----------- |
| GET    | `/branches`           | 전체 지점 목록 조회 |
| GET    | `/branches/:branchId` | 특정 지점 조회    |
| POST   | `/branches`           | 지점 추가       |
| DELETE | `/branches/:branchId` | 지점 삭제       |

### 1. 전체 지점 목록 조회
GET /branches

#### Response
{
  "success": true,
  "data": [
    {
      "ID": 1,
      "Branch_name": "대전 지점",
      "Address": "대전광역시 ...",
      "Phone": "010-1111-2222",
      "Manager_Name": "홍길동",
      "Company_id": 1
    }
  ]
} <br><br>

### 2. 특정 지점 조회
GET /branches/:branchId
### ex: GET /branches/1

#### Response
{
  "success": true,
  "data": {
    "ID": 1,
    "Branch_name": "대전 지점",
    "Address": "대전광역시 ...",
    "Phone": "010-1111-2222",
    "Manager_Name": "홍길동",
    "Company_id": 1
  }
} <br><br>

### 3. 지점 추가
POST /branches

#### Request Body
{
  "branchName": "대전 지점",
  "address": "대전광역시 ...",
  "phone": "010-1111-2222",
  "managerName": "홍길동",
  "companyId": 1
}

#### Response
{
  "success": true,
  "message": "지점 추가 성공"
} <br><br>

### 4. 지점 삭제
DELETE /branches/:branchId
### ex: DELETE /branches/1

#### Response
{
  "success": true,
  "message": "지점 삭제 성공"
} <br><br><br>


## Departemt API
### API List
| Method | URL                          | 설명          |
| ------ | ---------------------------- | ----------- |
| GET    | `/departments`               | 전체 부서 목록 조회 |
| GET    | `/departments/:departmentId` | 특정 부서 조회    |
| POST   | `/departments`               | 부서 추가       |
| DELETE | `/departments/:departmentId` | 부서 삭제       |

### 1. 전체 부서 목록 조회
GET /departments

#### Response
{
  "success": true,
  "data": [
    {
      "ID": 1,
      "Department_Name": "안전관리팀",
      "Description": "작업자 안전 관리 부서",
      "Phone": "010-2222-3333",
      "Branch_id": 1
    }
  ]
} <br><br>

### 2. 특정 부서 조회
GET /departments/:departmentId
### ex: GET /departments/1

#### Response
{
  "success": true,
  "data": {
    "ID": 1,
    "Department_Name": "안전관리팀",
    "Description": "작업자 안전 관리 부서",
    "Phone": "010-2222-3333",
    "Branch_id": 1
  }
} <br><br>

### 3. 부서 추가
POST /departments

#### Request Body
{
  "departmentName": "안전관리팀",
  "description": "작업자 안전 관리 부서",
  "phone": "010-2222-3333",
  "branchId": 1
}

#### Response
{
  "success": true,
  "message": "부서 추가 성공"
} <br><br>

### 4. 부서 삭제
DELETE /departments/:departmentId
### ex: DELETE /departments/1

#### Response
{
  "success": true,
  "message": "부서 삭제 성공"
} <br><br><br>

## Worker API
### API List
| Method | URL                  | 설명           |
| ------ | -------------------- | ------------ |
| GET    | `/workers`           | 전체 작업자 목록 조회 |
| GET    | `/workers/:workerId` | 특정 작업자 조회    |
| POST   | `/workers`           | 작업자 추가       |
| PATCH  | `/workers/:workerId` | 작업자 수정       |
| DELETE | `/workers/:workerId` | 작업자 삭제       |

### 1. 전체 작업자 조회
GET /workers

#### Response
{
  "success": true,
  "data": [
    {
      "workerId": 1,
      "workerName": "홍길동",
      "age": 26,
      "Gender": "남성",
      "Position": "작업자",
      "Blood_type": "A",
      "Emergency_contact": "010-1234-5678",
      "Disease": "없음",
      "departmentName": "안전관리팀",
      "branchName": "대전 지점",
      "companyName": "ABC 회사"
    }
  ]
} <br><br>

### 2. 특정 작업자 조회
GET /workers/:workerId
### ex: GET /workers/1

#### Response
{
  "success": true,
  "data": [
    {
      "workerId": 1,
      "workerName": "홍길동",
      "age": 26,
      "Gender": "남성",
      "Position": "작업자",
      "Blood_type": "A",
      "Emergency_contact": "010-1234-5678",
      "Disease": "없음",
      "departmentName": "안전관리팀",
      "branchName": "대전 지점",
      "companyName": "ABC 회사"
    }
  ]
} <<br><br>

### 3. 작업자 추가
POST /workers

#### Request Body
| 필드               | 타입     | 필수 | 설명       |
| ---------------- | ------ | -- | -------- |
| name             | String | O  | 작업자 이름   |
| birthDate        | Date   | O  | 생년월일     |
| gender           | String | O  | 성별       |
| position         | String | X  | 직책       |
| bloodType        | String | X  | 혈액형      |
| emergencyContact | String | X  | 비상 연락처   |
| disease          | String | X  | 질병 정보    |
| departmentId     | Number | O  | 소속 부서 ID |
<br>
{
  "name": "홍길동",
  "birthDate": "2000-01-01",
  "gender": "남성",
  "position": "작업자",
  "bloodType": "A",
  "emergencyContact": "010-1234-5678",
  "disease": "없음",
  "departmentId": 1
}

#### Response
{
  "success": true,
  "message": "작업자 추가 성공"
} <br><br>

### 4. 작업자 수정
PATCH /workers/:workerId
### Example

#### Request Body
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| name | String | X | 작업자 이름 |
| birthDate | Date | X | 생년월일 |
| gender | String | X | 성별 |
| position | String | X | 직책 |
| bloodType | String | X | 혈액형 |
| emergencyContact | String | X | 비상 연락처 |
| disease | String | X | 질병 정보 |
| departmentId | Number | X | 소속 부서 ID |

### Single Field
{
  "position": "관리자"
}

### Multi Field
{
  "position": "팀장",
  "bloodType": "AB",
  "disease": "없음"
}

#### Response
{
  "success": true,
  "message": "작업자 수정 성공"
} <br><br>

### 5. 작업자 삭제
DELETE /workers/:workerId
### ex: DELETE /workers/1

#### Response
{
  "success": true,
  "message": "작업자 삭제 성공"
} <br><br><br>

## Sensor API
### API List
| Method | URL                            | 설명                      |
| ------ | ------------------------------ | ----------------------- |
| POST   | `/sensors`                     | 센서 데이터 저장 및 AI 예측       |
| GET    | `/sensors/:workerId/:helmetId` | 특정 작업자/헬멧의 최신 센서 데이터 조회 |
| GET    | `/sensors/workers/:workerId`   | 특정 작업자의 센서 기록 조회        |

### 1. 센서 데이터 저장
POST /sensors

#### Request Body
| 필드          | 타입               | 필수 | 설명        |
| ----------- | ---------------- | -- | --------- |
| workerId    | Number           | O  | 작업자 ID    |
| helmetId    | Number           | O  | 헬멧 ID     |
| temperature | Number           | O  | 체온        |
| heartRate   | Number           | O  | 심박수       |
| ecgValue    | Number / Boolean | O  | ECG 이상 여부 |
<br>
{
  "workerId": 1,
  "helmetId": 1,
  "temperature": 36.5,
  "heartRate": 82,
  "ecgValue": 0
}

#### Response
{
  "success": true,
  "message": "센서 데이터 추가 성공",
  "ai": {
    "status": 2,
    "confidence": 0.95,
    "message": "정상 상태입니다."
  }
} <br><br>

### 2. 최근 센서 데이터 조회
GET /sensors/:workerId/:helmetId
### ex: GET /sensors/1/1

#### Response
{
  "success": true,
  "data": [
    {
      "worker_id": 1,
      "helmet_id": 1,
      "heart_rate": 82,
      "temperature": 36.5,
      "ecg_abnormal": 0,
      "status": 2,
      "confidence": 0.95,
      "updated_at": "2026-05-16T12:00:00.000Z"
    }
  ]
} <br><br>

### 3. 특정 작업자 센서 기록 조회
GET /sensors/workers/:workerId
### ex: GET /sensors/workers/1

#### Response
{
  "success": true,
  "data": [
    {
      "sensorId": 1,
      "Temperature": 36.5,
      "Heart_rate": 82,
      "ECG_value": 0,
      "Status": 2,
      "Measured_at": "2026-05-16T12:00:00.000Z"
    }
  ]
} <br><br><br>

## Helmet API
### API List
| Method | URL | 설명 |
| --- | --- | --- |
| GET | `/helmets` | 전체 헬멧 목록 조회 |
| GET | `/helmets/:helmetId` | 특정 헬멧 조회 |
| POST | `/helmets` | 헬멧 추가 |
| DELETE | `/helmets/:helmetId` | 헬멧 삭제 |

### 1. 전체 헬멧 조회
GET /helmets

#### Response
{
  "success": true,
  "data": [
    {
      "ID": 1,
      "Helmet_Name": "Helmet-001",
      "Department_id": 1
    }
  ]
} <br><br>

### 2. 특정 헬멧 조회
GET /helmets/:helmetId
### ex: GET /helmets/1

### 3. 헬멧 추가
POST /helmets

#### Request Body
| 필드           | 타입     | 필수 | 설명       |
| ------------ | ------ | -- | -------- |
| helmetName   | String | O  | 헬멧 이름    |
| departmentId | Number | O  | 소속 부서 ID |
<br>
{
  "helmetName": "Helmet-001",
  "departmentId": 1
}

#### Response
{
  "success": true,
  "message": "헬멧 추가 성공"
} <br><br>

### 4. 헬멧 삭제
DELETE /helmets/:helmetId

#### Response
{
  "success": true,
  "message": "헬멧 삭제 성공"
} <br><br><br>

#### Language : JavaScript
#### Framework : Express
#### Runtime : Node.js

***

## ai(Directory) => AI Model & Server, Training Data
### Language : Python

***

## requirements.txt => Venv Settings
