// The game core in JavaScript, built by sh mod/sim/run.sh core: see sim/jscore.
export declare const memory: { readonly buffer: ArrayBuffer }
export declare function alloc(len: number): number
export declare function answer(ptr: number, len: number): number
export declare function out_ptr(): number
