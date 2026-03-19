export type CountryOption = {
  code: string;
  name: string;
  nativeCurriculum?: string | null;
  phoneCode?: string | null;
  phoneMinLength?: number | null;
  phoneMaxLength?: number | null;
  flagEmoji?: string | null;
};

export const COUNTRIES: CountryOption[] = [
  {
    code: "KE",
    name: "Kenya",
    nativeCurriculum: "CBC",
    phoneCode: "+254",
    phoneMinLength: 9,
    phoneMaxLength: 9,
    flagEmoji: "🇰🇪",
  },
];