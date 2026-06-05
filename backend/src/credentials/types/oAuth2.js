module.exports = {
  name: 'oAuth2',
  displayName: 'OAuth2',
  properties: [
    { name: 'clientId', displayName: 'Client ID', type: 'string', required: true, default: '' },
    { name: 'clientSecret', displayName: 'Client Secret', type: 'string', required: true, typeOptions: { password: true }, default: '' },
    { name: 'authUrl', displayName: 'Authorization URL', type: 'string', required: true, default: '' },
    { name: 'tokenUrl', displayName: 'Token URL', type: 'string', required: true, default: '' },
    { name: 'accessToken', displayName: 'Access Token', type: 'string', required: false, typeOptions: { password: true }, default: '' },
    { name: 'refreshToken', displayName: 'Refresh Token', type: 'string', required: false, typeOptions: { password: true }, default: '' }
  ]
};
