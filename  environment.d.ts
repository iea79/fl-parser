declare global {
    namespace NodeJS {
        interface ProcessEnv {
            REACT_APP_VAPID_PUBLIC_KEY: string;
            REACT_APP_PARSER_API_URL: string;
            REACT_APP_SBP_LINK: string;
        }
    }
}
export {};
