import configuration from '../util/config';
import minioClient from './base/minio';

const uploadAvatar = async (userId: string, avatar: Buffer) => {
  const minio = configuration.minio;
  const { endPoint: ipAddress, port } = minio;

  const time = new Date().toISOString();
  const photoName = `${userId}-${time}.jpg`;

  await minioClient.putObject('avatar', photoName, avatar);

  return `http://${ipAddress}:${port}/avatar/${photoName}`;
};

export { uploadAvatar };
