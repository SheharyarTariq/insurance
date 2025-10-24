import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface CounterState {
  isClosed: boolean;
  referrence_no: string;
  surname: string;
  claimId: any;
}

const initialState: CounterState = {
  isClosed: false,
  referrence_no: '',
  surname: '',
  claimId: null,
};

const isClosedSlice = createSlice({
  name: "isClosed",
  initialState,
  reducers: {
    setIsClosed: (state, action: PayloadAction<boolean>) => {
      state.isClosed = action.payload;
    },
    toggleIsClosed: (state) => {
      state.isClosed = !state.isClosed;
    },
    setClaimReferrence: (state, action) => {
      state.referrence_no = action.payload
    },
    setClientSurName: (state, action) => {
      state.surname = action.payload
    },
    setClaimId: (state, action) => {
      state.claimId = action.payload
    }
  },
});

export const { setIsClosed, setClaimReferrence, setClientSurName, setClaimId } = isClosedSlice.actions;
export default isClosedSlice.reducer;
