//#region src/client/index.d.ts
/**
 * dsh-client-ui-paopaocat — Client plugin entry。
 * 注册 locale、创建 PpcLayer、挂载设置面板。
 */
declare const inject: string[];
declare function apply(ctx: any): void;
//#endregion
export { apply, inject };