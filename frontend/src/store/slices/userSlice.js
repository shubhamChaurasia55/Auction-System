import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { MdLeaderboard } from "react-icons/md";
import { toast } from "react-toastify";

const userSlice = createSlice({
    name: "user",
    initialState: {
        loading: false,
        isAuthenticated: false,
        user:{},
        leaderboard:[],
    },
    reducers:{

        registerRequest(state, action){
            state.loading = true;
            state.isAuthenticated = false;
            state.user = {};
        },
        registerSucess(state, action){
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
        },
        registerFailed(state, action){
            state.loading = false;
            state.isAuthenticated = false;
            state.user = {};
        },




        logoutSucess(state, action){
            state.isAuthenticated = false;
            state.user = {};
        },
        logoutFailed(state, action){
            state.loading = false;
            state.isAuthenticated = state.isAuthenticated;
            state.user = state.user;
        },
        clearAllErrors(state, action){
            state.user = state.user;
            state.isAuthenticated = state.isAuthenticated;
            state.leaderboard = state.leaderboard;
            state.loading = false;
        }
    }
});

export const register = (data) => async(dispatch) =>{
    dispatch(userSlice.actions.registerRequest());
    try {
        const response = await axios.post(
            "http://localhost:5050/api/v1/user/register",
            data,
            {
                withCredentials: true,
                headers:{"Content-Type" : "multipart/form-data"},
            }
        );
        dispatch(userSlice.actions.registerSucess(response.data));
        toast.success(response.data.message);
        dispatch(userSlice.actions.clearAllErrors());
    } catch (error) {
        dispatch(userSlice.actions.registerFailed());
        toast.error(error.response.data.message);
        dispatch(userSlice.actions.clearAllErrors());

    }
}

export const logout = () => async(dispatch) =>{
    try {
        const response = await axios.get("http://localhost:5050/api/v1/user/logout", {withCredentials: true});
        dispatch(userSlice.actions.logoutSucess());
        toast.success(response.data.message);
        dispatch(userSlice.actions.clearAllErrors());
    } catch (error) {
        dispatch(userSlice.actions.logoutFailed());
        toast.error(error.response.data.message);
        dispatch(userSlice.actions.clearAllErrors);
    }
}



export default userSlice.reducer;