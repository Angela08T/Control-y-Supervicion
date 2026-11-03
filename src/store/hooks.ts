import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { AppDispatch, RootState } from './index'

/** Dispatch tipado del store. */
export const useAppDispatch: () => AppDispatch = useDispatch

/** Selector tipado con RootState. */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
