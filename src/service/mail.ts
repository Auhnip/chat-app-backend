/*
 * @Author       : wqph
 * @Date         : 2023-03-31 22:09:57
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-05-17 16:54:52
 * @FilePath     : \backend\src\service\mail.ts
 * @Description  : 邮件发送服务
 */

import nodemailer, { type SendMailOptions } from 'nodemailer';
import Config from '../util/config';
import { StatusError } from '../util/response_wrapper';

const {
  mail: mailConnection,
  verificationCode: { mailSubject },
} = Config;

const transporter = nodemailer.createTransport(mailConnection);

/**
 * 根据给定的验证码，生成邮件内容
 * @param {string} code 给定的验证码
 * @return {string} 生成的包含验证码的邮件内容
 */
const getMailContent = (code: string): string => {
  return `<div><p style="font-size:1.5em;line-height:1.5">Your verification code is:<code style="background:rgba(169,169,169,0.5);border-radius:0.2em;padding-bottom:0.2em;padding-top:0.2em;padding-right:0.5em;padding-left:0.5em;margin-left:0.5em;margin-right:0.5em;">${code}</code>.</p></div>`;
};

/**
 * 根据给定的邮箱地址，获取 '@' 前面的字符串作为该邮箱的用户名
 * @param {string} mailAddress 邮箱地址
 * @return {string} 截取的字符串，作为该邮箱的用户名
 */
const getMailName = (mailAddress: string): string => {
  const nameEnd = mailAddress.indexOf('@');

  if (nameEnd === -1) {
    return mailAddress;
  }

  return mailAddress.slice(0, nameEnd);
};

/**
 * 给定收件人和需要发送的验证码，生成邮件的全部数据，返回包含内容的对象
 * @param {string} mailTo 邮件的收件人
 * @param {string} code 需要发送的验证码
 * @return {SendMailOptions} 包含邮件所有数据的对象
 */
const getMailData = (mailTo: string, code: string): SendMailOptions => {
  const mailFrom = mailConnection.auth.user;

  return {
    from: { name: getMailName(mailFrom), address: mailFrom },
    subject: mailSubject,
    to: { name: getMailName(mailTo), address: mailTo },
    html: getMailContent(code),
  };
};

/**
 * 验证码发送函数
 * 
 * @param {string} mailTo 需要将验证码发送到的邮箱地址
 * @param {string} code 验证码
 * @return {Promise<void>}
 */
const verificationCodeSender = async (mailTo: string, code: string): Promise<void> => {
  const data = getMailData(mailTo, code);

  const info = await transporter.sendMail(data);

  if (info.accepted.length === 0) {
    throw new StatusError('No one accepted mail', 'internal error');
  }
};

export default verificationCodeSender;
