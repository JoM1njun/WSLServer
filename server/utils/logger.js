// Simple Logger Utility
const getTime = () => {
    return new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul"
    });
};

export const logger = {
    info: (message, data = null) => {
        console.log(`\n✅ [INFO] ${getTime()}`);
        console.log(message);

        if (data) {
            console.log(data);
        }
    },

    warn: (message, data = null) => {
        console.warn(`\n⚠️ [WARN] ${getTime()}`);
        console.warn(message);

        if (data) {
            console.warn(data);
        }
    },

    error: (message, error = null) => {
        console.error(`\n❌ [ERROR] ${getTime()}`);
        console.error(message);

        if (error) {
            console.error(error);
        }
    }
};