//#region src/index.d.ts
/**
 * dsh-client-ui-paopaocat — Host-side entry (no-op for pure client theme).
 * The real logic lives in src/client/index.ts.
 */
declare const apply: () => void;
declare const inject: string[];
//#endregion
export { apply, inject };