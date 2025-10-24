import axiosInstance from "../axiosConfig";

export const getHireVehicleStatus = (query: string) => axiosInstance.get(`/hire-vehicle-status/${query}`);

export const sendEmailOnHire = (email: string, claimID: string, firstName: string, referrence_no: string, option: string) => axiosInstance.post(`/hire-vehicle-provided/send-email-on-hire`, { email, claimID, firstName, referrence_no, option });