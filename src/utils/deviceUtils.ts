// Проверка, запущено ли приложение как PWA
export const isPWA = (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
};

// Проверка, является ли устройство мобильным (планшет или смартфон)
export const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};