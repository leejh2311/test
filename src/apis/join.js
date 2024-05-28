import axios from "axios";

// 회원가입 API 호출 함수
export const joinApi = ({ userId, password, name, email }) => {
  const signUpUrl = "http://192.168.35.139:8081/admin/join";

  return axios.post(signUpUrl, {
    joinId: userId,
    password: password,
    userName: name,
    email: email,
  });
};
