// Schedule 3 Part B model cancellation form — Consumer Contracts (Information,
// Cancellation and Additional Charges) Regulations 2013 (SI 2013/3134).
//
// The text below reproduces the statutory Schedule 3 Part B wording verbatim.
// Trader-specific fields must be substituted at render time (see renderModelCancellationForm).

export const MODEL_CANCELLATION_FORM_TEMPLATE = `MODEL CANCELLATION FORM

(Complete and return this form only if you wish to cancel the contract)

To: [TRADER_NAME]
[TRADER_ADDRESS]
[TRADER_EMAIL]

I/We (*) hereby give notice that I/We (*) cancel my/our (*) contract of sale of the following goods (*)/for the supply of the following service (*),

Ordered on (*)/received on (*):

Name of consumer(s):

Address of consumer(s):

Signature of consumer(s) (only if this form is notified on paper):

Date:

(*) Delete as appropriate.`;

export interface CancellationFormFields {
    traderName: string;
    traderAddress: string;
    traderEmail: string;
}

/**
 * Returns the Schedule 3 Part B model cancellation form with trader details
 * substituted in. Pass BRAND values at call-site to avoid circular imports.
 */
export function renderModelCancellationForm(fields: CancellationFormFields): string {
    return MODEL_CANCELLATION_FORM_TEMPLATE
        .replace("[TRADER_NAME]", fields.traderName)
        .replace("[TRADER_ADDRESS]", fields.traderAddress)
        .replace("[TRADER_EMAIL]", fields.traderEmail);
}

/**
 * Raw template string with placeholders intact — useful for static rendering
 * when brand values are injected by the JSX layer.
 */
export const MODEL_CANCELLATION_FORM = MODEL_CANCELLATION_FORM_TEMPLATE;
