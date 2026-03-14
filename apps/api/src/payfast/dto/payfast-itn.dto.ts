import { IsOptional, IsString } from 'class-validator';

export class PayfastItnDto {
  @IsString()
  merchant_id!: string;

  @IsOptional()
  @IsString()
  merchant_key?: string;

  @IsString()
  m_payment_id!: string;

  @IsOptional()
  @IsString()
  pf_payment_id?: string;

  @IsString()
  payment_status!: string;

  @IsString()
  item_name!: string;

  @IsOptional()
  @IsString()
  item_description?: string;

  @IsString()
  amount_gross!: string;

  @IsOptional()
  @IsString()
  amount_fee?: string;

  @IsOptional()
  @IsString()
  amount_net?: string;

  @IsOptional()
  @IsString()
  name_first?: string;

  @IsOptional()
  @IsString()
  name_last?: string;

  @IsOptional()
  @IsString()
  email_address?: string;

  @IsOptional()
  @IsString()
  custom_str1?: string;

  @IsOptional()
  @IsString()
  custom_str2?: string;

  @IsOptional()
  @IsString()
  custom_str3?: string;

  @IsOptional()
  @IsString()
  custom_str4?: string;

  @IsOptional()
  @IsString()
  custom_str5?: string;

  @IsOptional()
  @IsString()
  custom_int1?: string;

  @IsOptional()
  @IsString()
  custom_int2?: string;

  @IsOptional()
  @IsString()
  custom_int3?: string;

  @IsOptional()
  @IsString()
  custom_int4?: string;

  @IsOptional()
  @IsString()
  custom_int5?: string;

  @IsString()
  signature!: string;
}
