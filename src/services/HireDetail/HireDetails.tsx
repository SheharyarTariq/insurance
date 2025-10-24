import axiosInstance from "../axiosConfig";

export const getClientVehicleCategory = (query: string) => {
  return axiosInstance.get(`/referrers/search/${query}`);
};

export const updateClientVehicleCategory = (data: any, id: string) => {
  return axiosInstance.put(`/client-vehicle-categories/${id}`, data);
};

export const createClientVehicleCategory = (data: any) => {
  return axiosInstance.post(`/client-vehicle-categories/`, data);
};