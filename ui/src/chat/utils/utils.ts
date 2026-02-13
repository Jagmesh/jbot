import type {Ref} from "vue";

export function getRefWidth(ref: Ref) {
    return ref.value ? ref.value.offsetWidth : 0
}