import { Client as MinioClient } from 'minio';
import configuration from '../../util/config';

const minioClient = new MinioClient(configuration.minio);

export default minioClient;
