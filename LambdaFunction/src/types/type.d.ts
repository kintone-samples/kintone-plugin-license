type LicenseItem = {
  pluginId: string;
  domain: string;
  expirationDate: string;
};

type RequestBody = {
  domain: string;
  pluginId: string;
};
