const ENV = import.meta.env.VITE_ENV

export const IS_DEMO = ENV === 'demo'
export const IS_STAGING = ENV === 'staging'
export const IS_PROD = ENV === 'prod'
