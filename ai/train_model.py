import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# 1. 데이터 불러오기
data = pd.read_csv("sensor_data.csv")

# 2. ecgAbnormal 값 숫자 변환
data["ecgAbnormal"] = data["ecgAbnormal"].astype(int)

# 3. heartDiff, tempDiff가 없으면 생성
if "heartDiff" not in data.columns:
    data["heartDiff"] = data["heartRate"] - data["avgHeartRate"]

if "tempDiff" not in data.columns:
    data["tempDiff"] = data["temperature"] - data["avgTemperature"]

# 4. 입력 데이터와 정답 데이터 분리
feature_columns = [
    "heartRate",
    "temperature",
    "ecgAbnormal",
    "avgHeartRate",
    "avgTemperature",
    "heartDiff",
    "tempDiff",
]

X = data[feature_columns]
y = data["status"]

# 5. 학습/테스트 데이터 분리
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,  # 전체 데이터 중 20%를 테스트 데이터로 사용
    random_state=42,  # 데이터 섞는 기준 값 고정
)

# 6. 모델 학습
model = RandomForestClassifier(n_estimators=100, random_state=42)  # 트리 개수 (다수결)

model.fit(X_train, y_train)

# 7. 성능 확인
y_pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# 8. 모델 저장
joblib.dump(model, "risk_model.pkl")

print("모델 저장 완료: risk_model.pkl")
print("학습 데이터 개수:", len(data))
print("status 분포:")
print(data["status"].value_counts())

def make_status(heartRate, temperature, ecgAbnormal, heartDiff, tempDiff):
    if heartRate >= 125 or temperature >= 38.5 or heartDiff >= 50 or tempDiff >= 2.0:
        return 3

    if heartRate >= 95 or temperature >= 37.5 or ecgAbnormal or heartDiff >= 25 or tempDiff >= 1.0:
        return 2

    return 1