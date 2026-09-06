/**
 * Validation telephone francaise partagee (T-BUGS-2026-09) : avant cette
 * util, Inscription/Profil/Adresses n'avaient aucune validation alors que
 * le checkout appliquait deja ce regex - centralise pour que les 4
 * emplacements se comportent pareil.
 */

export const FRENCH_PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

export const isValidFrenchPhone = (value) => {
  if (!value) return false;
  return FRENCH_PHONE_REGEX.test(value.replace(/\s/g, ''));
};

/**
 * Filtre les caracteres saisis a la frappe : ne garde que ce qu'un numero
 * francais peut legitimement contenir (chiffres, +, espaces, points, tirets).
 */
export const formatPhoneInput = (value) => value.replace(/[^\d+\s.-]/g, '').slice(0, 20);
