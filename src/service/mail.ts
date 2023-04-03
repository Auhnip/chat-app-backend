import nodemailer, { type SendMailOptions } from 'nodemailer';
import Config from '../util/config';

const {
  mail: mailConnection,
  verificationCode: { mailSubject },
} = Config;

const transporter = nodemailer.createTransport(mailConnection);

const getMailContent = (code: string) => {
  return `<div><p style="font-size:1.5em;line-height:1.5">Your verification code is:<code style="background:rgba(169,169,169,0.5);border-radius:0.2em;padding-bottom:0.2em;padding-top:0.2em;padding-right:0.5em;padding-left:0.5em;margin-left:0.5em;margin-right:0.5em;">${code}</code>.</p></div>`;
};

const getMailName = (mailAddress: string) => {
  const nameEnd = mailAddress.indexOf('@');

  if (nameEnd === -1) {
    return mailAddress;
  }

  return mailAddress.slice(0, nameEnd);
};

// 生成邮件数据
const getMailData = (mailTo: string, code: string): SendMailOptions => {
  const mailFrom = mailConnection.auth.user;

  return {
    from: { name: getMailName(mailFrom), address: mailFrom },
    subject: mailSubject,
    to: { name: getMailName(mailTo), address: mailTo },
    html: getMailContent(code),
  };
};

// 验证码发送工具函数
const verificationCodeSender = async (mailTo: string, code: string) => {
  const data = getMailData(mailTo, code);

  const info = await transporter.sendMail(data);

  if (info.accepted.length === 0) {
    throw new Error('No one accepted mail');
  }
};

export default verificationCodeSender;
