export class CreatePreferenceDto {
  title!: string;
  amount!: number;
  professionalSlug!: string;
  external_reference?: string;

  // Información opcional del pagador (mejora tasa de aprobación)
  payerEmail?: string;
  payerName?: string;
  payerSurname?: string;
}
