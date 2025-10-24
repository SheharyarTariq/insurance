import axiosInstance from "../axiosConfig";


export const createVehicleDetail = async (data: any) => {
    const response = await axiosInstance.post("/client-vehicles/", data);
    return response.data;
  };

export const uploadVCDoc = async (files: File[]) => {
  try {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post("/client-vehicles/import-client-vehicle/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error;
  }
};



  

export const getVehicleDetail = async (id: any) => {
  const response = await axiosInstance.get(`client-vehicles/${id}`);
  return response.data;
};


export const updateVehicle = async (data: any, id: any) => {
  const response = await axiosInstance.put(`/client-vehicles/${id}`, data);
  return response.data;
};