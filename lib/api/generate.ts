import nextServer from './api';

export const generateId = async () => {
  const id = await nextServer.get('/generate/id');
  return id.data;
};

export const generatePersonalCode = async () => {
  const personalCode = await nextServer.get<string>('/generate/personal-code');
  return personalCode;
};

export const generatePassword = async () => {
  const password = await nextServer.get<string>('/generate/id');
  return password;
};
