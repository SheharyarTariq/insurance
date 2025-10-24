import axiosInstance from "../axiosConfig";

export const updateVehicleDamage = async (data: any) => {
  try {
    const response = await axiosInstance.put(`/client-vehicles/damage-update`, data);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const aiAnalyze = async (formData: FormData): Promise<any> => {
  try {

    const response = await axiosInstance.post(
      "/car-damage-detection/detect",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("AI Analyze Error:", error);
    throw error;
  }
};


export const generateClientReport = async (claim_id: any) => {
  try {
    const response = await axiosInstance.get(`client-vehicles/damage-report/${claim_id}/client`);
    return response.data;
  } catch (error: any) {
    console.error("Generate Report Error:", error);
    throw error;
  }
}

export const generateThirdPartyReport = async (claim_id: any) => {
  try {
    const response = await axiosInstance.get(`client-vehicles/damage-report/${claim_id}/third-party`);
    return response.data;
  } catch (error: any) {
    console.error("Generate Report Error:", error);
    throw error;
  }
}

export const saveDamageDetails = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post("/client-vehicles/damage/ai", payload
      // {
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // }
    );

    return response.data;
};