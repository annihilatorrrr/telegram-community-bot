import localeConfig from 'public/locale.config.json';

export function getRestrictPermission(languageCode: string, userName: string) {
  const language = languageCode === 'ko' ? languageCode : "en";
  const restrictPermission = localeConfig[language].permission;

  return {
    message: `${userName}${restrictPermission.message}`,
    query: restrictPermission.query
  };
}

export function getWelcomeNotice(languageCode: string, userName: string) {
  const language = languageCode === 'ko' ? languageCode : "en";
  const welcomeNotice = localeConfig[language].notice;
  const replaceNameNotice = welcomeNotice.message.replace('XXX', userName);

  return {
    message: replaceNameNotice,
    query: welcomeNotice.query
  };
}

export function getAlertMessage(languageCode: string, type: string) {
  const language = languageCode === 'ko' ? languageCode : "en";
  
  return localeConfig[language][type];
}