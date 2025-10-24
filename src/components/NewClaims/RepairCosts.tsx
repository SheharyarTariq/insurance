import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ChevronDown } from "lucide-react";
import { MdArrowOutward } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import UploadCSV5Modal from "../VehicleDetailCard/uploadCV5.tsx";
import { uploadVCDocs } from "../../services/VehicleOwner/VehicleOwner.ts";
import { toast } from "react-toastify";
import { DatePicker } from "../application/date-picker/date-picker";
import type { DateValue } from "react-aria-components";
import { getLocalTimeZone, today } from "@internationalized/date";
import { costRepairApi, getRepairData, updateCostRepair } from "../../services/RepairAndCost/RepairAndCost.tsx";
import { parseDate } from "@internationalized/date";
import { CalendarDate } from "@internationalized/date";

interface FormData {
  labour: number;
  paintMaterials: number;
  parts: number;
  specialistCost: number;
  jobHire: number;
  subTotal: number;
  vat: number;
  totalIncVat: number;
  cilTotalReceived: number;
  actualRepairParts: number;
  actualRepairLabour: number;
  netCilAmount: number;
  cilAgreed: boolean;
  roadworthyCilFeeAgreed: boolean;
  agreementReceived: DateValue | null;
  engRepSentToTPI: DateValue | null;
  cilChequeReceived: DateValue | null;
  cilChequeSentToCL: DateValue | null;
  cilRemovalConfirmationRec: DateValue | null;
  vehiclePaymentBeneficiary: string;
  repairInst: DateValue | null;
  repairAuth: DateValue | null;
  estimationReceived: DateValue | null;
  repairStart: DateValue | null;
  repairCompleted: DateValue | null;
  claim_id: any
}

const validationSchema = Yup.object({
  labour: Yup.number()
    .typeError("Labour cost must be a number")
    .required("Labour cost is required")
    .min(0, "Must be a positive number"),

  paintMaterials: Yup.number()
    .typeError("Paint/Materials cost must be a number")
    .required("Paint/Materials cost is required")
    .min(0, "Must be a positive number"),

  parts: Yup.number()
    .typeError("Parts cost must be a number")
    .required("Parts cost is required")
    .min(0, "Must be a positive number"),

  specialistCost: Yup.number()
    .typeError("Specialist cost must be a number")
    .required("Specialist cost is required")
    .min(0, "Must be a positive number"),

  jobHire: Yup.number()
    .typeError("Job hire cost must be a number")
    .required("Job hire cost is required")
    .min(0, "Must be a positive number"),

  subTotal: Yup.number()
    .typeError("Sub total must be a number")
    .required("Sub total is required")
    .min(0, "Must be a positive number"),

  vat: Yup.number()
    .typeError("VAT must be a number")
    .required("VAT is required")
    .min(0, "Must be a positive number"),

  totalIncVat: Yup.number()
    .typeError("Total including VAT must be a number")
    .required("Total including VAT is required")
    .min(0, "Must be a positive number"),

  cilTotalReceived: Yup.number()
    .typeError("CIL total received must be a number")
    .required("CIL total received is required")
    .min(0, "Must be a positive number"),

  actualRepairParts: Yup.number()
    .typeError("Actual repair parts must be a number")
    .required("Actual repair parts cost is required")
    .min(0, "Must be a positive number"),

  actualRepairLabour: Yup.number()
    .typeError("Actual repair labour must be a number")
    .required("Actual repair labour cost is required")
    .min(0, "Must be a positive number"),

  netCilAmount: Yup.number()
    .typeError("Net CIL amount must be a number")
    .required("Net CIL amount is required")
    .min(0, "Must be a positive number"),

  cilAgreed: Yup.boolean()
    .oneOf([true, false], "CIL agreement status is required")
    .required("CIL agreement status is required"),

  roadworthyCilFeeAgreed: Yup.boolean()
    .oneOf([true, false], "Roadworthy CIL fee agreement is required")
    .required("Roadworthy CIL fee agreement is required"),

  vehiclePaymentBeneficiary: Yup.string()
    .required("Vehicle payment beneficiary is required"),

  agreementReceived: Yup.mixed().nullable(),
  engRepSentToTPI: Yup.mixed().nullable(),
  cilChequeReceived: Yup.mixed().nullable(),
  cilChequeSentToCL: Yup.mixed().nullable(),
  cilRemovalConfirmationRec: Yup.mixed().nullable(),
  repairInst: Yup.mixed().nullable(),
  repairAuth: Yup.mixed().nullable(),
  estimationReceived: Yup.mixed().nullable(),
  repairStart: Yup.mixed().nullable(),
  repairCompleted: Yup.mixed().nullable(),
});

interface RepairAndCostProps {
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  claimData?: any;
}

export interface VehicleOwnerDetailsHandle {
  submitForm: () => Promise<boolean>;
}

const now = today(getLocalTimeZone());

const RepairCosts = forwardRef<VehicleOwnerDetailsHandle, RepairAndCostProps>(
  ({ onSuccess, handleNext }, ref) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false)
    const [confirming, setConfirming] = useState(false);
    const [data, setData] = useState<FormData[]>([]);
    const [fieldError, setFieldError] = useState({});

    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');
    const dispatch = useDispatch()

    const engineer_report_received = useSelector(
      (state: any) => state?.engineer?.ocr_engineer
    );

    const [initialValues, setInitialValues] = useState({
      labour: 0,
      paintMaterials: 0,
      parts: 0,
      specialistCost: 0,
      jobHire: 0,
      subTotal: 0,
      vat: 0,
      totalIncVat: 0,
      cilTotalReceived: 0,
      actualRepairParts: 0,
      actualRepairLabour: 0,
      netCilAmount: 0,
      cilAgreed: false,
      roadworthyCilFeeAgreed: false,
      agreementReceived: null,
      engRepSentToTPI: null,
      cilChequeReceived: null,
      cilChequeSentToCL: null,
      cilRemovalConfirmationRec: null,
      vehiclePaymentBeneficiary: "",
      repairInst: null,
      repairAuth: null,
      estimationReceived: null,
      repairStart: null,
      repairCompleted: null,
    });


    const parseCalendarDate = (dateStr?: string) => {
      if (!dateStr) return undefined;
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return undefined;
      return new CalendarDate(year, month, day);
    }

    const formatCalendarDate = (date?: CalendarDate | any) => {
      if (!date) return undefined;
      const jsDate = new Date(date.year, date.month - 1, date.day);
      return jsDate.toISOString().split("T")[0];
    };


    const { isClosed } = useSelector((state: any) => state.isClosed);
    const { id } = useParams();
    const formikRef = useRef<any>(null);

    useEffect(() => {
      if (engineer_report_received) {
        setInitialValues((prev) => ({
          ...prev,
          labour: engineer_report_received?.labour || "",
          paintMaterials: engineer_report_received?.paint_material || "",
          parts: engineer_report_received?.parts || "",
          specialistCost: engineer_report_received?.miscellaneous || "",
          jobHire: engineer_report_received?.job_hire || "",
          subTotal: engineer_report_received?.sub_total || "",
          vat: engineer_report_received?.vat || "",
          totalIncVat: engineer_report_received?.total_inc_vat || ""
        }));
    
        const newErrors: Record<string, string> = {};
    
        if (!engineer_report_received?.engineer_fee) {
          newErrors["labour"] = "Low confidence OCR result - please verify.";
        }
        if (!engineer_report_received?.paint_material) {
          newErrors["paintMaterials"] = "Low confidence OCR result - please verify.";
        }
        if (!engineer_report_received?.parts) {
          newErrors["parts"] = "Low confidence OCR result - please verify.";
        }
        if (!engineer_report_received?.miscellaneous) {
          newErrors["specialistCost"] = "Low confidence OCR result - please verify.";
        }
        if (!engineer_report_received?.job_hire) {
          newErrors["jobHire"] = "Low confidence OCR result - please verify.";
        }
        if (!engineer_report_received?.sub_total) {
          newErrors["subTotal"] = "Low confidence OCR result - please verify.";
        }
        if (!engineer_report_received?.vat) {
          newErrors["vat"] = "Low confidence OCR result - please verify.";
        }
        if (!engineer_report_received?.total_inc_vat) {
          newErrors["totalIncVat"] = "Low confidence OCR result - please verify.";
        }
    
        setFieldError(newErrors);
      }
    }, [engineer_report_received]);
    



    // Handle uploadub
    const handleUpload = async (uploadedFiles: any) => {
      setConfirming(true);
      try {
        const response = await uploadVCDocs(uploadedFiles);
        setUploadModal(false);
        handleSetInitialValues(response.vehicle_owner_detail[0], "v5");
        toast.success("File uploaded successfully");
      } catch (e) {
        toast.error("Unable to upload file");
      } finally {
        setConfirming(false);
      }
    };

    // Populate values from API
    const handleSetInitialValues = (response: any, key?: string) => {
      const details = Array.isArray(response) ? response[0] : response?.[0] || response;
      if (!details) return;
      const updatedValues: FormValues = {
        labour: Number(details.labour) || 0,
        paintMaterials: Number(details.paint_material) || 0,
        parts: Number(details.parts) || 0,
        specialistCost: Number(details.miscellaneous) || 0,
        jobHire: Number(details.job_hire) || 0,
        subTotal: Number(details.sub_total) || 0,
        vat: Number(details.vat) || 0,
        totalIncVat: Number(details.total_inc_vat) || 0,
        cilTotalReceived: Number(details.cil_total_received) || 0,
        actualRepairParts: Number(details.actual_repair_costs_parts) || 0,
        actualRepairLabour: Number(details.actual_repair_costs_labour) || 0,
        netCilAmount: Number(details.net_cil_amount) || 0,
        cilAgreed: details.cil_agreed === false ? "false" : "true",
        roadworthyCilFeeAgreed: details.if_roadworthy_cil_fee_agreed === false ? "false" : "true",
        agreementReceived: parseCalendarDate(details.agreement_received) ? parseCalendarDate(details.agreement_received) : null,
        engRepSentToTPI: details.eng_rep_sent_tpi ? parseDate(details.eng_rep_sent_tpi) : null,
        cilChequeReceived: details.cil_cheque_request ? parseDate(details.cil_cheque_request) : null,
        cilChequeSentToCL: details.cil_cheque_sent_cl ? parseDate(details.cil_cheque_sent_cl) : null,
        cilRemovalConfirmationRec: details.cil_removal_confirmation_received ? parseDate(details.cil_removal_confirmation_received) : null,
        vehiclePaymentBeneficiary: details.repair_est_days || "",
        repairInst: details.repair_inst ? parseDate(details.repair_inst) : null,
        repairAuth: details.repair_auth ? parseDate(details.repair_auth) : null,
        estimationReceived: details.estimated_received ? parseDate(details.estimated_received) : null,
        repairStart: details.repair_start ? parseDate(details.repair_start) : null,
        repairCompleted: details.repair_completed ? parseDate(details.repair_completed) : null,
      };

      setInitialValues(updatedValues);


      if (key === "v5") {
        const newErrors: Record<string, string> = {};
        if (!details.payment_benificiary) {
          newErrors["vehiclePaymentBeneficiary"] =
            "Low confidence OCR result - please verify.";
        }
        setFieldError(newErrors);
      }
    };

    // Handle submit
    const handleSubmit = async (values: FormData) => {
      setLoading(true);
      setSuccess(false);
      try {
        const payload = {
          claim_id: Number(id || claimID),
          tenant_id: 1,
          labour: values.labour,
          paint_material: values.paintMaterials,
          parts: values.parts,
          miscellaneous: values.specialistCost,
          job_hire: values.jobHire,
          sub_total: values.subTotal,
          vat: values.vat,
          total_inc_vat: values.totalIncVat,
          cil_total_received: values.cilTotalReceived,
          actual_repair_costs_parts: values.actualRepairParts,
          actual_repair_costs_labour: values.actualRepairLabour,
          net_cil_amount: values.netCilAmount,
          cil_agreed: values.cilAgreed,
          if_roadworthy_cil_fee_agreed: values.roadworthyCilFeeAgreed,
          agreement_received: formatCalendarDate(values.agreementReceived),
          eng_rep_sent_tpi: formatCalendarDate(values.engRepSentToTPI),
          cil_cheque_request: formatCalendarDate(values.cilChequeReceived),
          cil_cheque_sent_cl: formatCalendarDate(values.cilChequeSentToCL),
          cil_removal_confirmation_received: formatCalendarDate(values.cilRemovalConfirmationRec),
          repair_est_days: values.vehiclePaymentBeneficiary,
          repair_inst: formatCalendarDate(values.repairInst),
          repair_auth: formatCalendarDate(values.repairAuth),
          estimated_received: formatCalendarDate(values.estimationReceived),
          repair_start: formatCalendarDate(values.repairStart),
          repair_completed: formatCalendarDate(values.repairCompleted),
        };


        const storedClaimId = id || claimID;

        let response;

        if ((id || claimID) && isEditing) {
          response = await updateCostRepair(storedClaimId, payload);
        } else {
          response = await costRepairApi?.createVehicleRepair(payload);
        }
        // dispatch(setOcrEngineer((payload)))

        setSuccess(true);
        toast.success("Repair costs saved successfully!");

        if (handleNext) {
          handleNext(8, "next");
        }
      } catch (error) {
        console.error("Error saving repair costs:", error);
        toast.error("Failed to save repair costs");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (id || claimID) {
        const fetchOwner = async () => {
          try {
            const RepairandCostData = await getRepairData(id || claimID);
            setData(RepairandCostData);
            handleSetInitialValues(RepairandCostData, "data");
            if(RepairandCostData !== undefined){
              setIsEditing(true)
            }
          } catch (err) {
            console.error("Error fetching repair costs:", err);
            setIsEditing(false)
          }
        };
        fetchOwner();
      } else {
        console.warn("⚠️ No id found in route params. Check your <Route path> definition.");
      }
    }, [id]);

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

    const getFieldError = (fieldName: keyof FormData, formik: any) =>
      formik.touched[fieldName] && formik.errors[fieldName] ? (
        <div className="text-red-500 text-xs mt-1">{formik.errors[fieldName]}</div>
      ) : null;

    return (
      <>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize

        >
          {(formik) => {
            const { setFieldValue, errors, values } = formik;
            useEffect(() => {
              const { cilTotalReceived, actualRepairParts, actualRepairLabour } = values;
        
              const total = Number(cilTotalReceived || 0);
              const parts = Number(actualRepairParts || 0);
              const labour = Number(actualRepairLabour || 0);
        
              const net = total - (parts + labour);
        
              if (values.netCilAmount !== net) {
                setFieldValue("netCilAmount", net);
              }
            }, [
              values.cilTotalReceived,
              values.actualRepairParts,
              values.actualRepairLabour
            ]);

            useEffect(() => {
              const labour = Number(values.labour);
              const paintMaterials = Number(values.paintMaterials);
              const parts = Number(values.parts);
              const specialistCost = Number(values.specialistCost);
              const jobHire = Number(values.jobHire);
        
              // Subtotal
              const subTotal = labour + paintMaterials + parts + specialistCost + jobHire;
        
              // VAT (20%)
              const vat = subTotal * 0.2;
        
              // Total incl VAT
              const totalIncVat = subTotal + vat;
        
              if (values.subTotal !== subTotal) {
                setFieldValue("subTotal", subTotal.toFixed(2));
              }
              if (values.vat !== vat) {
                setFieldValue("vat", vat.toFixed(2));
              }
              if (values.totalIncVat !== totalIncVat) {
                setFieldValue("totalIncVat", totalIncVat.toFixed(2));
              }
            }, [
              values.labour,
              values.paintMaterials,
              values.parts,
              values.specialistCost,
              values.jobHire
            ]);

            return (
              <Form className="sm:pt-8 pb-8 sm:pb-12 sm:pl-6 sm:pr-4 lg:pr-10 bg-white">
                {/* HEADER */}
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 mb-2">
                      Agreed repair costs as per engineer’s report
                    </h1>
                  </div>
                </div>

                <section>
                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Labour
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="labour"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('labour', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Paint/Materials
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="paintMaterials"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('paintMaterials', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Parts
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="parts"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('parts', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Specialist/Additional Cost/Miscellaneous
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="specialistCost"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('specialistCost', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Job Hire
                    </label>
                    <div className="flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="jobHire"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>

                    {fieldError["jobHire"] ? <p className='text-red-500 text-xs'>{fieldError["jobHire"]}</p> : ''}
                        <ErrorMessage name="jobHire" component="div" className="text-red-500 text-xs mt-1" />

                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Sub Total
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="subTotal"
                          type="number"
                          readOnly
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('subTotal', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      VAT
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="vat"
                          type="number"
                          step="0.01"
                          readOnly
                          style={{ height: '44px' }}
                          disabled
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('vat', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Total Inc VAT
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="totalIncVat"
                          type="number"
                          step="0.01"
                          readOnly
                          style={{ height: '44px' }}
                          disabled
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('totalIncVat', formik)}
                    </div>
                  </div>
                </section>

                {/* Actual Repair Costs */}
                <section>
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 mb-2">
                        Actual repair costs
                      </h1>
                      <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                        Enter actual repair costs
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      CIL Total Received
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="cilTotalReceived"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('cilTotalReceived', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Actual Repair Costs Parts
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="actualRepairParts"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('actualRepairParts', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Actual Repair Costs Labour
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="actualRepairLabour"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('actualRepairLabour', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Net CIL Amount
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="netCilAmount"
                          type="number"
                          step="0.01"
                          style={{ height: '44px' }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                        />
                        <div className="relative w-[110px] sm:w-[130px]">
                          <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                            <option>GBP</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      {getFieldError('netCilAmount', formik)}
                    </div>
                  </div>
                </section>

                {/* CLI Settlement */}
                <section>
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 mb-2">
                        Where the repair followed a CIL settlement
                      </h1>
                      {/* <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                      
                      </p> */}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6 mt-7">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      CIL Agreed?
                    </label>
                    <div className="w-full sm:w-3/4 flex gap-4">
                      <label className="flex items-center">
                        <Field
                          type="radio"
                          name="cilAgreed"
                          value="true"
                          disabled={isClosed}
                          className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <Field
                          type="radio"
                          name="cilAgreed"
                          value="false"
                          disabled={isClosed}
                          className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                      {getFieldError('cilAgreed', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6 mt-7">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      If roadworthy CIL fee agreed?
                    </label>
                    <div className="w-full sm:w-3/4 flex gap-4">
                      <label className="flex items-center">
                        <Field
                          type="radio"
                          name="roadworthyCilFeeAgreed"
                          value="true"
                          disabled={isClosed}
                          className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <Field
                          type="radio"
                          name="roadworthyCilFeeAgreed"
                          value="false"
                          disabled={isClosed}
                          className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                      {getFieldError('roadworthyCilFeeAgreed', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Agreement Received
                    </label>
                    <div className="w-[81%]">
                      <Field name="agreementReceived">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value}
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                      {getFieldError('agreementReceived', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Eng. Rep. Sent to TPI
                    </label>
                    <div className="w-[81%]">
                      <Field name="engRepSentToTPI">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value}
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                      {getFieldError("engRepSentToTPI", formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      CIL Cheque Received
                    </label>
                    <div className="w-[81%]">
                      <Field name="cilChequeReceived">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value}  // ✅ read directly from Formik
                            onChange={(value) => form.setFieldValue(field.name, value)} // ✅ update Formik
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>

                      {getFieldError('cilChequeReceived', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      CIL Cheque Sent to CL
                    </label>
                    <div className="w-[81%]">

                      <Field name="cilChequeSentToCL">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value} 
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>


                      {getFieldError('cilChequeSentToCL', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      CIL Removal Confirmation Rec
                    </label>
                    <div className="w-[81%]">

                      <Field name="cilRemovalConfirmationRec">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value}
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                      {getFieldError('cilRemovalConfirmationRec', formik)}
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <div className='flex cursor-pointer'>
                      <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">CIL Agreement Letter</h2>
                      <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                    </div>
                    <div className='flex cursor-pointer'>
                      <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Eng Rep to TPI for Auth</h2>
                      <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                    </div>
                    <div className='flex cursor-pointer'>
                      <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Send CIL to Client</h2>
                      <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                    </div>
                    <div className='flex cursor-pointer'>
                      <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Instruct Fleet to Off Hire</h2>
                      <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                    </div>
                  </div>
                </section>

                {/* Repair Instruction Details */}
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 mb-2">
                      Repair instruction details
                    </h1>
                    <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                      Enter repair instruction details
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <button
                      type="button"
                      className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Instruct Roadworthy to Arrange Hire
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Eng. Rep to TPI for Auth
                    </button>
                  </div>
                </div>
                <hr className="mb-4 sm:mb-6 mt-8" />

                {/* Repair Loss of Use Dates */}
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 mb-2">
                      Where repair loss of use dates
                    </h1>
                  </div>
                </div>

                <section>
                  <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                    <label className="w-full sm:w-1/4 mr-3 text-sm font-medium text-gray-700">
                      Repair Est. Days
                    </label>
                    <div className="relative w-full sm:w-3/4">
                      <Field
                        type="number"
                        name="vehiclePaymentBeneficiary"
                        disabled={isClosed}
                        placeholder="Type here.."
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                      />
                      {getFieldError('vehiclePaymentBeneficiary', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Repair Inst.
                    </label>
                    <div className="w-[81%]">
                      <Field name="repairInst">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value} 
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                      {getFieldError('repairInst', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Repair Auth.
                    </label>
                    <div className="w-[81%]">

                      <Field name="repairAuth">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value}
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>

                      {getFieldError('repairAuth', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Estimation Received
                    </label>
                    <div className="w-[81%]">
                      <Field name="estimationReceived">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value}
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>

                      {getFieldError('estimationReceived', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Repair Start
                    </label>
                    <div className="w-[81%]">
                      <Field name="repairStart">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value} 
                            onChange={(value) => form.setFieldValue(field.name, value)}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>

                      {getFieldError('repairStart', formik)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Repair Completed
                    </label>
                    <div className="w-[81%]">

                      <Field name="repairCompleted">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={field.value}
                            onChange={(value) => form.setFieldValue(field.name, value)} 
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                      {getFieldError('repairCompleted', formik)}
                    </div>
                  </div>
                </section>

                {/* Success */}
                {success && (
                  <div className="mx-6 mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    Repair costs saved successfully!
                  </div>
                )}
              </Form>
            );
          }}
        </Formik>

        <UploadCSV5Modal
          isOpen={uploadModal}
          onClose={() => setUploadModal(false)}
          onUpload={handleUpload}
          confirming={confirming}
        />
      </>
    );
  }
);

RepairCosts.displayName = "RepairCosts";

export default RepairCosts;