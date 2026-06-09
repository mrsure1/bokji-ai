export interface SsisSidoCode {
  sidoCode: string;
  sidoName: string;
}

export interface SsisSignguCode {
  signguCode: string;
  signguName: string;
}

export interface SsisServiceTypeCode {
  serviceTypeCode: string;
  serviceTypeName: string;
}

export interface SsisCommonCodeResponse<T> {
  resultCode: string;
  resultMsg: string;
  items: T[];
}
