## server(Directory) => Web or App Server
### controllers = DB Insert, Delete, Select etc Function (요청 & 응답 처리)
### routes = URL Connect (각 DB Controller Server.js와 연결)
### middlewear = Exception & Error Handling (예외처리 및 오류처리)
### utils = Public Function (공통 기능 함수)

## 사용법
### https://wslserver.onrender.com/API Name/추가 API URL <= 필요시
### API Name => 
### 회사 : company, 지점 : branches, 부서 : departments, 작업자 : workers, 헬멧 : helmets, 센서 : sensors

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
}

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
}

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
}
 
***
#### Language : JavaScript
#### Framework : Express
#### Runtime : Node.js

***

## ai(Directory) => AI Model & Server, Training Data
### Language : Python

***

## requirements.txt => Venv Settings
