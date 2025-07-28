const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Logs dizinini oluştur
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Log formatı
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...rest
        });
    })
);

// API servis logları için logger
const serviceLogger = winston.createLogger({
    format: logFormat,
    transports: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'service-errors.log'),
            level: 'error',
            handleExceptions: true
        }),
        new winston.transports.File({ 
            filename: path.join(logsDir, 'service-info.log'),
            level: 'info'
        })
    ]
});

// Geliştirme ortamında konsola da log basalım
if (process.env.NODE_ENV !== 'production') {
    serviceLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
        handleExceptions: true
    }));
}

module.exports = {
  logServiceError: (serviceName, error) => {
    serviceLogger.error({
      service: serviceName,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  },
  
  logServiceInfo: (serviceName, info) => {
    serviceLogger.info({
      service: serviceName,
      ...info,
      timestamp: new Date().toISOString()
    });
  }
};
