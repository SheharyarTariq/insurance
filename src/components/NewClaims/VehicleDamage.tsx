import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import carTopView from "../../assets/images/748e2eb5bb4752f4038bd83956052738e93317bb.png";
import { ButtonGroup, ButtonGroupItem } from "../base/button-group/button-group";
import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useParams, useSearchParams } from "react-router-dom";
import { getClientVehicle, getThirdPartyVehicle } from "../../services/Lookups/Generaldetails";
import CustomSelect from "../ReactSelect/ReactSelect";
import { useSelector } from "react-redux";
import { aiAnalyze, generateClientReport, generateThirdPartyReport, saveDamageDetails, updateVehicleDamage } from "../../services/VehicleDamage/VehicleDamage";
import { getVehicleDetail } from "../../services/Vehicle/vehicle";
import html2pdf from "html2pdf.js";

// Validation schema
const validationSchema = Yup.object().shape({
  entryMode: Yup.string().required("Entry mode is required"),
  client: Yup.object().shape({
    areaDamage: Yup.string().required("Client area of damage is required"),
    unrelatedDamage: Yup.string().nullable(),
    status: Yup.string().required("Client vehicle status is required"),
    images: Yup.array().when("entryMode", {
      is: "ai",
      then: Yup.array().min(1, "At least one client image is required"),
      otherwise: Yup.array().notRequired(),
    }),
  }),
  thirdParty: Yup.object().shape({
    areaDamage: Yup.string().required("Third party area of damage is required"),
    unrelatedDamage: Yup.string().nullable(),
    status: Yup.string().required("Third party vehicle status is required"),
    images: Yup.array().when("entryMode", {
      is: "ai",
      then: Yup.array().min(1, "At least one third party image is required"),
      otherwise: Yup.array().notRequired(),
    }),
  }),
});

const damageZones = [
  { id: "front", label: "Front" },
  { id: "rear", label: "Rear" },
  { id: "left", label: "Nearside" },
  { id: "right", label: "Offside" },
];

// All possible damage zones
const allDamageZones = ["front", "front-right", "right", "rear-right", "rear", "rear-left", "left", "front-left"];

// Helper function to convert array to object with all zones
const convertZonesToObject = (zonesArray: string[]) => {
  const zonesObject: { [key: string]: boolean } = {};
  allDamageZones.forEach(zone => {
    zonesObject[zone] = zonesArray.includes(zone);
  });
  return zonesObject;
};

// Helper function to convert object back to array of selected zones
const convertObjectToZones = (zonesObject: { [key: string]: boolean }) => {
  return Object.keys(zonesObject).filter(zone => zonesObject[zone]);
};

export interface VehicleDamageProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
}

type VehicleSectionProps = {
  title: string;
  subTitle: string;
  type: string;
  selectedZones: { [key: string]: boolean };
  setSelectedZones: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  isDisabled?: boolean;
};

type VehicleAISectionProps = {
  title: string;
  subTitle: string;
  type: string;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setFieldValue: (field: string, value: any) => void;
  isDisabled?: boolean;
  clientVehicleId?: string;
  thirdPartyVehicleId?: string;
};

const ImageUploader = ({
  images,
  setImages,
  setModalOpen,
  type,
  setFieldValue,
  setClientReport,
  setThirdPartyReport,
  isDisabled,
  clientVehicleId,
  thirdPartyVehicleId,
}: {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  type: string;
  setFieldValue: (field: string, value: any) => void;
  setClientReport: React.Dispatch<React.SetStateAction<null>>;
  setThirdPartyReport: React.Dispatch<React.SetStateAction<null>>;
  isDisabled?: boolean;
  clientVehicleId?: string;
  thirdPartyVehicleId?: string;
}) => {
    const {id} = useParams()
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [damageDetails, setDamageDetails] = useState(false)
    const [analyzeResponseClient, setAnalyzeResponseClient] = useState(null)
    const [analyzeResponseThird, setAnalyzeResponseThird] = useState(null)
    const [singleImageAnalysisResponse, setSingleImageAnalysisResponse] = useState(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageViewModal, setImageViewModal] = useState(false);

  const handleAddImage = () => {
    if (!isDisabled) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const fileArray = Array.from(selectedFiles);
      const previews = fileArray.map((file) => URL.createObjectURL(file));

      setFiles((prev) => [...prev, ...fileArray]);
      setImages((prev) => {
        const updatedImages = [...prev, ...previews];
        setFieldValue(`${type.toLowerCase()}.images`, updatedImages);
        return updatedImages;
      });
    }
  };

  const transformResponseToPayload = (response: any, type: string, claimId: string) => {
    const normalizedReport = response.normalized_report;
    console.log("clientVehicleId", clientVehicleId)
    console.log("thirdPartyVehicleId", thirdPartyVehicleId)
    // Create the vehicle detail object based on type
    const vehicleDetailData = {
      id: clientVehicleId ||thirdPartyVehicleId || 0,
      client_area_of_damage: normalizedReport?.area_of_damage || "",
      client_unrelated_damage: normalizedReport?.client_unrelated_damage || "",
      client_vehicle_status_id: normalizedReport?.client_vehicle_status_id || 0,
      damage_diagram: normalizedReport?.damage_diagram || {},
      damage_side: normalizedReport?.damage_side || "",
      area_of_damage: normalizedReport?.area_of_damage || "",
      type_of_damage: normalizedReport?.type_of_damage || "",
      severity: normalizedReport?.severity || "",
      confidence_percent: normalizedReport?.confidence_percent || 0,
      total_damaged_points_identified: normalizedReport?.total_damaged_points_identified || 0,
      suggested_repair_action: normalizedReport?.suggested_repair_action || "",
      vehicle_status_id: normalizedReport?.vehicle_status_id || 0,
      raw_result: normalizedReport?.raw_result || {},
      images: images // Use the current images array
    };

    // Create empty vehicle detail object
    const emptyVehicleDetail = {
      id: 0,
      client_area_of_damage: "",
      client_unrelated_damage: "",
      client_vehicle_status_id: 0,
      damage_diagram: {},
      damage_side: "",
      area_of_damage: "",
      type_of_damage: "",
      severity: "",
      confidence_percent: 0,
      total_damaged_points_identified: 0,
      suggested_repair_action: "",
      vehicle_status_id: 0,
      raw_result: {},
      images: []
    };

    return {
      claim_id: parseInt(claimId) || 0,
      vehicle_detail: type === 'Client' ? vehicleDetailData : emptyVehicleDetail,
      third_party_vehicle_detail: type !== 'Client' ? vehicleDetailData : emptyVehicleDetail,
      damage_side: normalizedReport?.damage_side || "",
      area_of_damage: normalizedReport?.area_of_damage || "",
      type_of_damage: normalizedReport?.type_of_damage || "",
      severity: normalizedReport?.severity || "",
      confidence_percent: normalizedReport?.confidence_percent || 0,
      total_damaged_points_identified: normalizedReport?.total_damaged_points_identified || 0,
      suggested_repair_action: normalizedReport?.suggested_repair_action || "",
      vehicle_status_id: normalizedReport?.vehicle_status_id || 0,
      raw_result: normalizedReport?.raw_result || {},
      images: images // Use the current images array
    };
  };

  const analyzeImage = async (type: string) => {
    try {
      if (files.length === 0) return;

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      
      formData.append("include_summary", "true");
      formData.append("include_annotated_image", "true");

      const response = await aiAnalyze(formData);
      if(type === 'Client'){
        setAnalyzeResponseClient(response)
      } else{
        setAnalyzeResponseThird(response)
      }
      console.log( "===============response==================",response)
      
      // Transform response to the required payload format
      const payload = transformResponseToPayload(response, type, id || claimID || '0');
      await saveDamageDetails(payload)
      setDamageDetails(true)

    } catch (error) {
      console.error("Image analysis failed", error);
    }
  };

  const analyzeSingleImage = async (imageIndex: number, type: string) => {
    try {
      if (files.length === 0 || !files[imageIndex]) return;

      const formData = new FormData();
      formData.append("images", files[imageIndex]);
      formData.append("include_summary", "true");
      formData.append("include_annotated_image", "true");

      const response = await aiAnalyze(formData);
      setSingleImageAnalysisResponse(response);
      
      // Transform and save single image analysis
      const payload = transformResponseToPayload(response, type, id || claimID || '0');
      await saveDamageDetails(payload);
      
      setImageViewModal(true);
    } catch (error) {
      console.error("Single image analysis failed", error);
      toast.error("Failed to analyze image");
    }
  };

  const handleViewReport = async (type: string) => {
    try{
      let res;
      if(type === 'Client'){
        res = await generateClientReport(id || claimID)
      }else{
        res = await generateThirdPartyReport(id || claimID)
      }
        if(type === 'Client'){
            setClientReport(res)
        } else{
            setThirdPartyReport(res)
        }
    
    } catch(e){
        toast.error('Unable to get report')
    } finally{
        setModalOpen(true)
    }
  }

  return (
    <>
    <div className="border rounded-md p-4">
      <div className="flex gap-3 overflow-x-auto mb-4">
        {images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`vehicle-${idx}`}
            onClick={() => {
              setSelectedImage(src);
              analyzeSingleImage(idx, type);
            }}
            className="h-20 w-20 rounded-md object-cover hover:cursor-pointer"
          />
        ))}
        <button
          type="button"
          onClick={handleAddImage}
          disabled={isDisabled}
          className={`flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-md text-3xl font-light text-gray-400 ${
            isDisabled ? "cursor-not-allowed" : "hover:border-blue-500 hover:text-blue-500"
          }`}
        >
          +
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isDisabled}
      />

      <button
        onClick={() => analyzeImage(type)}
        type="button"
        disabled={images.length === 0 || isDisabled}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          images.length === 0 || isDisabled
            ? "bg-blue-200 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        Analyze Images
      </button>
      <Modal open={imageViewModal} onClose={() => setImageViewModal(false)}>
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-sm p-6 max-h-[90vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Selected Image
              </h3>
              <img src={selectedImage} alt="Full Size" className="w-full h-auto rounded" />
            </div>
            
            {/* Analysis Results Section */}
            {singleImageAnalysisResponse && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Analysis Results
                </h3>
                <div className="grid grid-cols-1 gap-y-3 gap-x-6 text-sm">
                  <div className="text-gray-500 font-medium">Damage side</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.damage_side || ''} readOnly />

                  <div className="text-gray-500 font-medium">Area of damage</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.area_of_damage || ''} readOnly />

                  <div className="text-gray-500 font-medium">Type of damage</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.type_of_damage || ''} readOnly />

                  <div className="text-gray-500 font-medium">Severity</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.severity || ''} readOnly />

                  <div className="text-gray-500 font-medium">Confidence</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={`${singleImageAnalysisResponse?.normalized_report?.confidence_percent || 0}%`} readOnly />

                  <div className="text-gray-500 font-medium">Total damaged points identified</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.total_damaged_points_identified || ''} readOnly />

                  <div className="text-gray-500 font-medium">Suggested repair action</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={singleImageAnalysisResponse?.normalized_report?.suggested_repair_action || ''} readOnly />

                  <div className="text-gray-500 font-medium">Vehicle status</div>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" value="Unroadworthy" readOnly />
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
    {damageDetails && type === 'Client' ?  <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
        Damage Details
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
        <div className="text-gray-500 font-medium">Damage side</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.damage_side} readOnly />

        <div className="text-gray-500 font-medium">Area of damage</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.area_of_damage} readOnly />

        <div className="text-gray-500 font-medium">Type of damage</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.type_of_damage} readOnly />

        <div className="text-gray-500 font-medium">Severity</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.severity} readOnly />

         <div className="text-gray-500 font-medium">Confidence</div>
         <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={`${analyzeResponseClient?.normalized_report?.confidence_percent || 0}%`} readOnly />

        <div className="text-gray-500 font-medium">Total damaged points identified</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.total_damaged_points_identified} readOnly />

        <div className="text-gray-500 font-medium">Suggested repair action</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseClient?.normalized_report?.suggested_repair_action} readOnly />

        <div className="text-gray-500 font-medium">Vehicle status</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value="Unroadworthy" readOnly />
      </div>
      <button
        type="button"
        onClick={() => {
            handleViewReport(type)
        }}
        className="px-4 mt-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
      >
        View Report
      </button>
    </div> : damageDetails && type !== 'Client' ? <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
        Damage Details
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
        <div className="text-gray-500 font-medium">Damage side</div>
         <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.damage_side} readOnly />

        <div className="text-gray-500 font-medium">Area of damage</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.area_of_damage} readOnly />

        <div className="text-gray-500 font-medium">Type of damage</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.type_of_damage} readOnly />

        <div className="text-gray-500 font-medium">Severity</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.severity} readOnly />

        <div className="text-gray-500 font-medium">Confidence</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={`${analyzeResponseThird?.normalized_report?.confidence_percent || 0}%`} readOnly />

        <div className="text-gray-500 font-medium">Total damaged points identified</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.total_damaged_points_identified} readOnly />

        <div className="text-gray-500 font-medium">Suggested repair action</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={analyzeResponseThird?.normalized_report?.suggested_repair_action} readOnly />

        <div className="text-gray-500 font-medium">Vehicle status</div>
        <input type="text" className="w-full border rounded px-3 py-2 text-sm" value="Unroadworthy" readOnly />
      </div>
      <button
        type="button"
        onClick={() => {
            handleViewReport(type)
        }}
        className="px-4 mt-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
      >
        View Report
      </button>
    </div> : ''}
    
    </>
    
  );
};

const VehicleAISection: React.FC<VehicleAISectionProps> = ({
  clientVehicleId,
  thirdPartyVehicleId,
  title,
  subTitle,
  type,
  images,
  setImages,
  setFieldValue,
  isDisabled,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const {id} = useParams()
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get('claimid');
  const [clientReport, setClientReport] = useState(null)
  const [thirdPartyReport, setThirdPartyReport] = useState(null)

  const reportRefThirdParty = useRef(null);
  const reportRefClient = useRef(null);

  const handlePrint = (type: string) => {
    if(type === 'Client'){
        const printContents = reportRefClient.current.innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
    } else{
        const printContents = reportRefThirdParty.current.innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <section>
        <h2 className="text-lg font-semibold mb-1">{type} Vehicle Details</h2>
        <p className="text-gray-500 mb-4">{subTitle}</p>
        <ImageUploader
          clientVehicleId={clientVehicleId}
          thirdPartyVehicleId={thirdPartyVehicleId}
          images={images}
          setImages={setImages}
          setModalOpen={setModalOpen}
          type={type}
          setThirdPartyReport={setThirdPartyReport}
          setClientReport={setClientReport}
          setFieldValue={setFieldValue}
          isDisabled={isDisabled}
        />
      </section>
      <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
        <div
          className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
            {type === 'Client' ? <div ref={reportRefClient}>
                <h2 className="text-lg font-semibold mb-4">{type} Vehicle Damage Report</h2>
          <div className="text-sm mb-6 space-y-1">
            <div className="flex justify-between">
              <span>Claim ID</span>
              <span>{id || claimID}</span>
            </div>
            <div className="flex justify-between">
              <span>Report ID</span>
              <span>{clientReport?.report_details?.report_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Generated on</span>
              <span>{clientReport?.report_details?.generated_on}</span>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Upload Details</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Uploaded by</span>
                <span>{clientReport?.upload_details?.uploaded_by}</span>
              </div>
              <div className="flex justify-between">
                <span>File name</span>
                <span>{clientReport?.upload_details?.file_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded on</span>
                <span>{clientReport?.upload_details?.uploaded_on}</span>
              </div>
              <div className="flex justify-between">
                <span>Source</span>
                <span>{clientReport?.upload_details?.source}</span>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Vehicle Details</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Vehicle Reg. No.</span>
                <span>{clientReport?.vehicle_details?.vehicle_reg_no}</span>
              </div>
              <div className="flex justify-between">
                <span>Make/Model</span>
                <span>{clientReport?.vehicle_details?.make_model}</span>
              </div>
              <div className="flex justify-between">
                <span>Color</span>
                <span>{clientReport?.vehicle_details?.color}</span>
              </div>
              <div className="flex justify-between">
                <span>Year</span>
                <span>{clientReport?.vehicle_details?.year}</span>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}UnrelatedDamage`}>
              {type} Unrelated Damage
            </label>
            <Field
              name={`${type.toLowerCase()}.unrelatedDamage`}
              as="input"
              value={clientReport?.client_unrelated_damage}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Type here..."
              disabled={isDisabled}
            />
            <ErrorMessage
              name={`${type.toLowerCase()}.unrelatedDamage`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}.status`}>
              {type} Vehicle Status
            </label>
            <Field
              name={`${type.toLowerCase()}.status`}
              as="select"
              className="w-full border rounded px-3 py-2 text-sm"
              disabled={isDisabled}
            >
              <option value="Unroadworthy">Unroadworthy</option>
              <option value="Roadworthy">Roadworthy</option>
            </Field>
            <ErrorMessage
              name={`${type.toLowerCase()}.status`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Detected Damages</h3>
            <table className="table-fixed w-full text-sm border-collapse border border-gray-300">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Damage side</td>
                  <td className="px-2 py-1">{clientReport?.detected_damages?.damage_side}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Area of damage</td>
                  <td className="px-2 py-1">{clientReport?.detected_damages?.area_of_damage}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Type of damage</td>
                  <td className="px-2 py-1">{clientReport?.detected_damages?.type_of_damage}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Severity</td>
                  <td className="px-2 py-1">{clientReport?.detected_damages?.severity}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Confidence %</td>
                  <td className="px-2 py-1">{clientReport?.detected_damages?.confidence_percent}%</td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Total damaged points identified</td>
                  <td className="px-2 py-1">{clientReport?.detected_damages?.total_damaged_points_identified}</td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">AI suggested actions</td>
                  <td className="px-2 py-1">{clientReport?.detected_damages?.ai_suggested_actions}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Uploaded Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`uploaded-${idx}`}
                  className="rounded-md object-cover w-full h-24"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{clientReport?.confirmation?.confirmed_by} confirmed at {clientReport?.confirmation?.confirmed_at}</p>
          </div>
          <div className="mb-6 border-t pt-4">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total by Severity</span>
                <span>{clientReport?.summary?.total_by_severity}</span>
              </div>
              <div className="flex justify-between">
                <span>Area</span>
                <span>{clientReport?.summary?.area}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Work Category</span>
                <span>{clientReport?.summary?.estimated_work_category}</span>
              </div>
            </div>
          </div>
            </div> : <div ref={reportRefThirdParty}>
            
            <h2 className="text-lg font-semibold mb-4">{type} Vehicle Damage Report</h2>
          <div className="text-sm mb-6 space-y-1">
            <div className="flex justify-between">
              <span>Claim ID</span>
              <span>{id || claimID}</span>
            </div>
            <div className="flex justify-between">
              <span>Report ID</span>
              <span>{thirdPartyReport?.report_details?.report_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Generated on</span>
              <span>{thirdPartyReport?.report_details?.generated_on}</span>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Upload Details</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Uploaded by</span>
                <span>{thirdPartyReport?.upload_details?.uploaded_by}</span>
              </div>
              <div className="flex justify-between">
                <span>File name</span>
                <span>{thirdPartyReport?.upload_details?.file_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded on</span>
                <span>{thirdPartyReport?.upload_details?.uploaded_on}</span>
              </div>
              <div className="flex justify-between">
                <span>Source</span>
                <span>{thirdPartyReport?.upload_details?.source}</span>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Vehicle Details</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Vehicle Reg. No.</span>
                <span>{thirdPartyReport?.vehicle_details?.vehicle_reg_no}</span>
              </div>
              <div className="flex justify-between">
                <span>Make/Model</span>
                <span>{thirdPartyReport?.vehicle_details?.make_model}</span>
              </div>
              <div className="flex justify-between">
                <span>Color</span>
                <span>{thirdPartyReport?.vehicle_details?.color}</span>
              </div>
              <div className="flex justify-between">
                <span>Year</span>
                <span>{thirdPartyReport?.vehicle_details?.year}</span>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}UnrelatedDamage`}>
              {type} Unrelated Damage
            </label>
            <Field
              name={`${type.toLowerCase()}.unrelatedDamage`}
              as="input"
              value={thirdPartyReport?.client_unrelated_damage}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Type here..."
              disabled={isDisabled}
            />
            <ErrorMessage
              name={`${type.toLowerCase()}.unrelatedDamage`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium text-sm" htmlFor={`${type.toLowerCase()}.status`}>
              {type} Vehicle Status
            </label>
            <Field
              name={`${type.toLowerCase()}.status`}
              as="select"
              className="w-full border rounded px-3 py-2 text-sm"
              disabled={isDisabled}
            >
              <option value="Unroadworthy">Unroadworthy</option>
              <option value="Roadworthy">Roadworthy</option>
            </Field>
            <ErrorMessage
              name={`${type.toLowerCase()}.status`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Detected Damages</h3>
            <table className="table-fixed w-full text-sm border-collapse border border-gray-300">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Damage side</td>
                  <td className="px-2 py-1">{thirdPartyReport?.detected_damages?.damage_side}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Area of damage</td>
                  <td className="px-2 py-1">{thirdPartyReport?.detected_damages?.area_of_damage}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Type of damage</td>
                  <td className="px-2 py-1">{thirdPartyReport?.detected_damages?.type_of_damage}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Severity</td>
                  <td className="px-2 py-1">{thirdPartyReport?.detected_damages?.severity}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Confidence %</td>
                  <td className="px-2 py-1">{thirdPartyReport?.detected_damages?.confidence_percent}%</td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">Total damaged points identified</td>
                  <td className="px-2 py-1">{thirdPartyReport?.detected_damages?.total_damaged_points_identified}</td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 px-2 py-1 font-semibold">AI suggested actions</td>
                  <td className="px-2 py-1">{thirdPartyReport?.detected_damages?.ai_suggested_actions}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Uploaded Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`uploaded-${idx}`}
                  className="rounded-md object-cover w-full h-24"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{thirdPartyReport?.confirmation?.confirmed_by} confirmed at {thirdPartyReport?.confirmation?.confirmed_at}</p>
          </div>
          <div className="mb-6 border-t pt-4">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total by Severity</span>
                <span>{thirdPartyReport?.summary?.total_by_severity}</span>
              </div>
              <div className="flex justify-between">
                <span>Area</span>
                <span>{thirdPartyReport?.summary?.area}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Work Category</span>
                <span>{thirdPartyReport?.summary?.estimated_work_category}</span>
              </div>
            </div>
          </div>
          </div>}
          <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600" disabled={isDisabled}>
            Save to Claim
          </button>
          <div className="flex space-x-3 mt-4">
            <button onClick={() => {
                            if (type === 'Client') {
                                html2pdf()
                                    .set({
                                        margin: 8,
                                        filename: "client-report.pdf",
                                        image: { type: "jpg", quality: 0.98 },
                                        html2canvas: {
                                            scale: 2,
                                            useCORS: true, // Important for fonts and images
                                            logging: true,
                                        },
                                        jsPDF: {
                                            unit: "mm",
                                            format: "a4",
                                            orientation: "portrait",
                                        },
                                    })
                                    .from(reportRefClient.current)
                                    .save();
                            } else{
                                html2pdf()
                                    .set({
                                        margin: 8,
                                        filename: "third-party.pdf",
                                        image: { type: "jpg", quality: 0.98 },
                                        html2canvas: {
                                            scale: 2,
                                            useCORS: true, // Important for fonts and images
                                            logging: true,
                                        },
                                        jsPDF: {
                                            unit: "mm",
                                            format: "a4",
                                            orientation: "portrait",
                                        },
                                    })
                                    .from(reportRefThirdParty.current)
                                    .save();
                            }
                        }} className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-100" disabled={isDisabled}>
              Download PDF
            </button>
            <button className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-100" disabled={isDisabled}>
              Email Report
            </button>
            <button onClick={() => {
                handlePrint(type)
            }} className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-100" disabled={isDisabled}>
              Print
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const VehicleSection: React.FC<VehicleSectionProps> = ({vehicleStatus, title, subTitle, type, selectedZones, setSelectedZones, isDisabled, setFieldValue }) => {
  const { isClosed } = useSelector((state: any) => state.isClosed);
  const toggleZone = (zoneId: string, setFieldValue: FormikHelpers<any>["setFieldValue"]) => {
    if (isDisabled) return;
  
    setSelectedZones((prev) => {
      const newZones = {
        ...prev,
        [zoneId]: !prev[zoneId],
      };
  
      const selectedZoneLabels = convertObjectToZones(newZones).join(", ");
      const fieldKey = `${type === 'Client' ? type.toLowerCase() : type.toLowerCase().replace(" ", "_")}.areaDamage`;
  
      setFieldValue(fieldKey, selectedZoneLabels);
  
      return newZones;
    });
  };
  
  console.log("============================type========================",type.toLowerCase())

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{subTitle}</p>
      <p className="flex justify-center font-bold mb-4">Offside</p>
      <div className="relative w-full max-w-md mx-auto">
        <img src={carTopView} alt="Car Top View" className="w-full" />
        <div className="absolute inset-0 flex flex-wrap justify-center items-center pointer-events-none">
          <div className="absolute left-2 top-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["front"] || false}
              onChange={() => toggleZone("front", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute right-2 top-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["rear"] || false}
              onChange={() => toggleZone("rear", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute top-2 left-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["right"] || false}
              onChange={() => toggleZone("right", setFieldValue)}
              disabled={isDisabled}
            />
            
          </div>
          <div className="absolute bottom-2 left-[48%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["left"] || false}
              onChange={() => toggleZone("left", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute top-[10%] left-[10%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["front-right"] || false}
              onChange={() => toggleZone("front-right", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute bottom-[10%] left-[10%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["front-left"] || false}
              onChange={() => toggleZone("front-left", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute top-[10%] left-[88%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["rear-right"] || false}
              onChange={() => toggleZone("rear-right", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
          <div className="absolute bottom-[10%] left-[88%] pointer-events-auto">
            <input
              type="checkbox"
              checked={selectedZones["rear-left"] || false}
              onChange={() => toggleZone("rear-left", setFieldValue)}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
      <p className="flex justify-center font-bold mt-4">Nearside</p>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium col-span-1">{type} Area of Damage</label>
          <div className="col-span-2">
            <Field
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.areaDamage`}
              onChange={(e) => {
                setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.areaDamage`, e.target.value)
              }}
              as="input"
              placeholder={convertObjectToZones(selectedZones).join(", ") || "Type here..."}
              className="w-full border rounded-md px-3 py-2 text-sm"
              disabled={isDisabled}
            />
            <ErrorMessage
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.areaDamage`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium col-span-1">{type} Unrelated Damage</label>
          <div className="col-span-2">
            <Field
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.unrelatedDamage`}
              as="input"
              onChange={(e) => {
                setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.unrelatedDamage`, e.target.value)
              }}
              placeholder="Type here..."
              className="w-full border rounded-md px-3 py-2 text-sm"
              disabled={isDisabled}
            />
            <ErrorMessage
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.unrelatedDamage`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium col-span-1">{type} Vehicle Status</label>
          <div className="col-span-2">
            {/* <Field
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`}
              as="select"
              onChange={(e) => {
                setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`, e.target.value)
              }}
              className="w-full border rounded-md px-3 py-2 text-sm"
              disabled={isDisabled}
            >
              <option value="Unroadworthy">Unroadworthy</option>
              <option value="Roadworthy">Roadworthy</option>
            </Field> */}
            <Field name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`}>
              {({ field, form, meta }: any) => (
                <div>
                  <CustomSelect
                    options={vehicleStatus.map((h: any) => ({
                      value: h.id,
                      label: h.label,
                    }))}
                    value={vehicleStatus
                      .map((h: any) => ({ value: h.id, label: h.label }))
                      .find((opt: any) => opt.value === field.value) || { value: '', label: '' }}
                    onChange={(option) => form.setFieldValue(`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`, option ? option.value : 0)}
                    placeholder="Select reason"
                    disabled={isClosed}
                  />
                  {meta.touched && meta.error && (
                    <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                  )}
                </div>
              )}
            </Field>
            <ErrorMessage
              name={`${type === 'Client' ? type.toLowerCase() : type?.toLowerCase().replace(" ", "_")}.status`}
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const VehicleDamageForm = forwardRef(({ onSuccess, handleNext }: VehicleDamageProps, ref) => {
  const searchParams = new URLSearchParams(window.location.search);
  const claimId = searchParams.get('claimid');
  const { id } = useParams();
  const formikRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false); // Replace with actual logic, e.g., useSelector for isClosed
  const [selectedKeys, setSelectedKeys] = useState(new Set(["manual"]));
  const [clientZones, setClientZones] = useState<{ [key: string]: boolean }>(convertZonesToObject([]));
  const [thirdPartyZones, setThirdPartyZones] = useState<{ [key: string]: boolean }>(convertZonesToObject([]));
  const [clientImages, setClientImages] = useState<string[]>([]);
  const [thirdPartyImages, setThirdPartyImages] = useState<string[]>([]);
  const [clientVehicleId, setClientVehicleId] = useState<string>("");
  const [thirdPartyVehicleId, setThirdPartyVehicleId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false)
  const [clientVehicleStatus, setClientVehicleStatus] = useState<LookupItem[]>([]);
  const [thirdPartyVehicleStatus, setThirdPartyVehicleStatus] = useState<LookupItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const currentClaimId = claimId || id;
    if (currentClaimId && !dataLoaded) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          const vehicleData = await getVehicleDetail(currentClaimId);
          console.log("Vehicle data received:", vehicleData);
          // Update initial values state
          setInitialValues({
            entryMode: "manual",
            client: {
              areaDamage: vehicleData.damage_area || "",
              unrelatedDamage: vehicleData.unrelated_damage || "",
              status: vehicleData.vehicle_status_id || "",
              images: [],
            },
            third_party: {
              areaDamage: vehicleData.third_party_vehicles?.[0]?.damage_area || "",
              unrelatedDamage: vehicleData.third_party_vehicles?.[0]?.unrelated_damage || "",
              status: vehicleData.third_party_vehicles?.[0]?.vehicle_status_id || "",
              images: [],
            },
          });
          
          // Update zones with damage diagram data
          if (vehicleData.damage_diagram) {
            setClientZones(vehicleData.damage_diagram);
          }
          
          // Update third party zones if available
          if (vehicleData.third_party_vehicles?.[0]?.damage_diagram) {
            setThirdPartyZones(vehicleData.third_party_vehicles[0].damage_area);
          } else if (vehicleData.third_party_vehicles?.[0]?.damage_area) {
            // Convert damage area string to zones object
            const thirdPartyZonesArray = vehicleData.third_party_vehicles[0].damage_area.split(", ");
            setThirdPartyZones(convertZonesToObject(thirdPartyZonesArray));
          }
          
          // Store vehicle IDs for payload
          setClientVehicleId(vehicleData.id?.toString() || "");
          setThirdPartyVehicleId(vehicleData.third_party_vehicles?.[0]?.id?.toString() || "");
          
          // Mark data as loaded to prevent re-fetching
          setDataLoaded(true);
          
        } catch (error) {
          console.error("Error fetching vehicle details:", error);
          toast.error("Failed to load vehicle details");
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }

    getDropdownData()
  }, [id, claimId, dataLoaded]);


  const getDropdownData = async () => {
    const [
      clientVehicleStatus,
      thirdPartyVehicleStatus,
    ] = await Promise.all([
      getClientVehicle(),
      getThirdPartyVehicle(),

    ]);
    setClientVehicleStatus(clientVehicleStatus.data);
    setThirdPartyVehicleStatus(thirdPartyVehicleStatus.data);

  }


  const [initialValues, setInitialValues] = useState({
    entryMode: "manual",
    client: {
      areaDamage: "",
      unrelatedDamage: "",
      status: "Unroadworthy",
      images: [],
    },
    third_party: {
      areaDamage: "",
      unrelatedDamage: "",
      status: "Unroadworthy",
      images: [],
    },
  })

  console.log("initial values", initialValues)
  console.log("clientZones", clientZones)
  console.log("thirdPartyZones", thirdPartyZones)

  // Handle form submission
  const handleSubmit = async (values: any, actions: any) => {
    try {
      setIsLoading(true);
      const payload = {
        claim_id: parseInt(claimId || id || '0'),
        vehicle_detail: {
          id: parseInt(clientVehicleId) || 0,
          client_area_of_damage: convertObjectToZones(clientZones).join(", "),
          client_unrelated_damage: values.client.unrelatedDamage || "",
          client_vehicle_status_id: parseInt(values.client.status) || 0,
          damage_diagram: clientZones
        },
        third_party_vehicle_detail: {
          id: parseInt(thirdPartyVehicleId) || 0,
          client_area_of_damage: convertObjectToZones(thirdPartyZones).join(", "),
          client_unrelated_damage: values.third_party.unrelatedDamage || "",
          client_vehicle_status_id: parseInt(values.third_party.status) || 0,
          damage_diagram: thirdPartyZones
        }
      };
      if(selectedKeys.has("manual")){
        try{
          await updateVehicleDamage(payload);
          toast.success("Vehicle damage details saved successfully");
        } catch(e: any){
          toast.error("Unable to save vehicle damage details");
        }
        
      }
      if (handleNext) handleNext(1, "next");
    } catch (error: any) {
      toast.error(`Unable to save vehicle damage details: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      // actions.setSubmitting(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose submitForm method to parent
  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      if (formikRef.current) {
        await formikRef.current.submitForm();
        if (formikRef.current.isValid) {
          return true;
        } else {
          throw new Error("Form validation failed");
        }
      }
      throw new Error("Form not available");
    },
  }));

  const handleSelectionChange = (newSelection: Set<string>) => {
    if (newSelection.size === 0) return;
    setSelectedKeys(newSelection);
    formikRef.current.setFieldValue("entryMode", newSelection.values().next().value);
  };

  console.log(initialValues, "valllll")

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-sm rounded-md">
      <Formik
        initialValues={initialValues}
        // validationSchema={validationSchema}
        onSubmit={handleSubmit}
        innerRef={formikRef}
        enableReinitialize
      >
        {({ values, setFieldValue }) => {
          console.log(values, "ccccc")
          return(
<Form>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Vehicle Damage Details</h2>
                <p className="text-gray-500 text-sm">Enter Vehicle Damage Details below</p>
              </div>
              <ButtonGroup selectedKeys={selectedKeys} onSelectionChange={handleSelectionChange} type="single">
                <ButtonGroupItem id="manual">Enter Details Manually</ButtonGroupItem>
                <ButtonGroupItem id="ai">Enter Details Using AI</ButtonGroupItem>
              </ButtonGroup>
            </div>
            {selectedKeys.has("manual") ? (
              <>
                <VehicleSection
                  title="Client Vehicle Details"
                  subTitle="Enter Client Vehicle Details"
                  type="Client"
                  selectedZones={clientZones}
                  setFieldValue={setFieldValue}
                  setSelectedZones={setClientZones}
                  isDisabled={isDisabled || isLoading}
                  vehicleStatus={clientVehicleStatus}
                />
                <VehicleSection
                  title="Third Party Vehicle Details"
                  subTitle="Enter Third Party Vehicle Details"
                  type="Third Party"
                  setFieldValue={setFieldValue}
                  selectedZones={thirdPartyZones}
                  setSelectedZones={setThirdPartyZones}
                  isDisabled={isDisabled || isLoading}
                  vehicleStatus={thirdPartyVehicleStatus}
                />
              </>
            ) : (
              <>
                <VehicleAISection
                  clientVehicleId={clientVehicleId}
                  title="Client Vehicle Details"
                  subTitle="Enter Client Vehicle Details"
                  type="Client"
                  images={clientImages}
                  setImages={setClientImages}
                  setFieldValue={setFieldValue}
                  isDisabled={isDisabled || isLoading}
                />
                <VehicleAISection
                  thirdPartyVehicleId={thirdPartyVehicleId}
                  title="Third Party Vehicle Details"
                  subTitle="Enter Third Party Vehicle Details"
                  type="Third Party"
                  images={thirdPartyImages}
                  setImages={setThirdPartyImages}
                  setFieldValue={setFieldValue}
                  isDisabled={isDisabled || isLoading}
                />
              </>
            )}
          </Form>
          )
          
        }}
      </Formik>
    </div>
  );
});

VehicleDamageForm.displayName = "VehicleDamageForm";
export default VehicleDamageForm;