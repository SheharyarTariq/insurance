import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import * as Yup from 'yup';
import { FaTimes } from 'react-icons/fa';
import { ChevronDown, Mail } from 'lucide-react';
import CustomSelect from "../ReactSelect/ReactSelect";
import { DatePicker } from "../application/date-picker/date-picker";
import { getLocalTimeZone, today } from "@internationalized/date";
import { CalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { useParams } from 'react-router-dom';
import UploadCSV5Modal from '../VehicleDetailCard/uploadCV5';
import LeafletAutocompleteMap from '../GoogleMapAutoComplete/GoogleMapAutoComplete';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import PhoneInput from 'react-phone-input-2';
import { MdArrowOutward } from 'react-icons/md';
import { EngineerDetailsApi, gettingEnginerDetails, instructEngineer, udpateEnginerDetails, uploadVCEngineer } from '../../services/EngineeringDetails/engineeringDetails';
import { debounce } from 'lodash';
import { setEngineerReportReceived, setOcrEngineer } from '../../redux/Engineer/engineerSlice';
import { useDispatch } from "react-redux";
import { getCompanySuggestions } from '../../services/Referrer/Referrer';
import { parseCalendarDate } from '../../common/common';

// Type definitions
type Vehicle = {
  make: string;
  model: string;
  registration: string;
  color: string;
  fuelType: string;
  engineSize: string;
  transmission: string;
  bodyType: string;
  seats: string;
  category: string;
};

type BoroughDetails = {
  name: string;
  taxiType: string;
  clientBadgeNumber: string;
  badgeExpirationDate: string;
  vehicleBadgeNumber: string;
  otherBorough: boolean;
};

type ThirdPartyVehicle = {
  make: string;
  model: string;
  registration: string;
  color: string;
  imagesAvailable: boolean;
};


interface EngineerDetailsFormProps {
  claimData?: any;
  isEditMode?: boolean;
  handleNext?: (step: number, direction: string) => void;
}

interface Company {
  id: number;
  company_name: string;
}

const booleanOptions = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const EngineerDetails = forwardRef(
  ({ handleNext }: EngineerDetailsFormProps, ref) => {

    const { id } = useParams();
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');
    const dispatch = useDispatch();
    const engineer_report_received = useSelector(
      (state: any) => state?.engineer?.engineer_report_received
    );


  const [uploadModal, setUploadModal] = useState(false);
  const [vehicleModal, setVehicleModal] = useState(false);
  const [dvlaModal, setDvlaModal] = useState(false);
  const [midModal, setMidModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [typing, setTyping] = useState(false);
  const [data, setData] = useState<any>(null);
  const [instructing, setInstructing] = useState<any>(false)

  const now = today(getLocalTimeZone());

  const [invoiceReceivedOn, setInvoiceReceivedOn] = useState<DateValue | null>(now);
  const [invoicePaidOn, setInvoicePaidOn] = useState<DateValue | null>(now);
  const [invoiceSettledOn, setInvoiceSettledOn] = useState<DateValue | null>(now);
  const [engineerInstructed, setEngineerInstructed] = useState<DateValue | null>(now);
  const [inspectionDate, setInspectionDate] = useState<DateValue | null>(now);
  const [engineerReportReceivedDate, setEngineerReportReceivedDate] = useState<DateValue | null>(now);

  const { isClosed } = useSelector((state: any) => state.isClosed);

  const formikRef = useRef<any>(null);

  const [initialValues, setInitialValues] = useState({
    companyName: '',
    vehicle_payment_beneficiary: '',
    reference: '',
    currency: 'GBP',
    actual_fee: 0,
    invoice_received_on: '',
    invoice_paid_on: '',
    invoice_settled_on: '',
    invoice_settled_amount: 0,
    engineer_report_received: false,
    engineer_instructed: '',
    inspection_date: '',
    engineer_report_received_date: '',
    engineer_fee: 0,
    site: '',
    engineer_address: {
      address: '',
      postcode: '',
      landline_tel: '',
      mobile_tel: '',
      email: ''
    },
    vehicle_address: {
      address: '',
      postcode: '',
      mobile_tel: '',
      email: ''
    }
  });

  // Validation schema
  const validationSchema = Yup.object({
    companyName: Yup.string().required('Company name is required'),
    vehicle_payment_beneficiary: Yup.string().required('Vehicle payment beneficiary is required'),
    reference: Yup.string().required('Reference is required'),
    currency: Yup.string().required('Currency is required'),
  
    actual_fee: Yup.number()
      .typeError('Actual fee must be a number')
      .required('Actual fee is required'),
  
    invoice_received_on: Yup.string(),
    invoice_paid_on: Yup.string(),
    invoice_settled_on: Yup.string(),
  
    invoice_settled_amount: Yup.number()
      .typeError('Invoice settled amount must be a number')
      .required('Invoice settled amount is required'),
  
    engineer_report_received: Yup.boolean()
      .oneOf([true, false], 'Engineer report received must be true or false')
      .required('Engineer report received is required'),
  
    engineer_instructed: Yup.string(),
    inspection_date: Yup.string(),
    engineer_report_received_date: Yup.string(),
  
    engineer_fee: Yup.number()
      .typeError('Engineer fee must be a number')
      .required('Engineer fee is required'),
  
    site: Yup.string().required('Site is required'),
  
    engineer_address: Yup.object({
      address: Yup.string().required('Engineer address is required'),
      postcode: Yup.string().required('Engineer postcode is required'),
      landline_tel: Yup.string().required('Engineer landline telephone is required'),
      // mobile_tel: Yup.string().required('Engineer mobile telephone is required'),
      email: Yup.string()
        .email('Invalid email format')
        .required('Engineer email is required'),
    }),
  
    vehicle_address: Yup.object({
      address: Yup.string().required('Vehicle address is required'),
      postcode: Yup.string().required('Vehicle postcode is required'),
      // mobile_tel: Yup.string().required('Vehicle mobile telephone is required'),
      // email: Yup.string()
      //   .email('Invalid email format')
      //   .required('Vehicle email is required'),
    }),
  });

  useEffect(() => {
    fetchDetails();
    // fetchClaimData();
  }, []);

  const fetchDetails = async () => {
    try {
      const res = await gettingEnginerDetails(claimID || id);
      const mappedValues = {
        companyName: res.companyName || '',
        vehicle_payment_beneficiary: res.vehicle_payment_beneficiary || '',
        reference: res.reference || '',
        currency: res.currency || 'GBP',
        actual_fee: res.actual_fee || 0,
        invoice_received_on: res.invoice_received_on || '',
        invoice_paid_on: res.invoice_paid_on || '',
        invoice_settled_on: res.invoice_settled_on || '',
        invoice_settled_amount: res.invoice_settled_amount || 0,
        engineer_report_received: res.engineer_report_received || false,
        engineer_instructed: res.engineer_instructed || '',
        inspection_date: res.inspection_date || '',
        engineer_report_received_date: res.engineer_report_received_date || '',
        engineer_fee: res.engineer_fee || 0,
        site: res.site || '',
        engineer_address: {
          address: res.engineer_address?.address || '',
          postcode: res.engineer_address?.postcode || '',
          landline_tel: res.engineer_address?.landline_tel || '',
          mobile_tel: res.engineer_address?.mobile_tel || '',
          email: res.engineer_address?.email || ''
        },
        vehicle_address: {
          address: res.vehicle_address?.address || '',
          postcode: res.vehicle_address?.postcode || '',
          mobile_tel: res.vehicle_address?.mobile_tel || '',
          email: res.vehicle_address?.email || ''
        }
      };

      setInvoiceReceivedOn(parseCalendarDate(res.invoice_received_on));
      setInvoicePaidOn(parseCalendarDate(res.invoice_paid_on));
      setInvoiceSettledOn(parseCalendarDate(res.invoice_settled_on));
      setEngineerInstructed(parseCalendarDate(res.engineer_instructed));
      setInspectionDate(parseCalendarDate(res.inspection_date));
      setEngineerReportReceivedDate(parseCalendarDate(res.engineer_report_received_date));
      setInitialValues(mappedValues);
      setIsEditing(true);
    } catch (e) {
      console.error('Failed to fetch details:', e);
      setIsEditing(false)
    }
  };


  const formatCalendarDate = (date?: CalendarDate) => {
    if (!date) return undefined;
    const jsDate = new Date(date.year, date.month - 1, date.day);
    return jsDate.toISOString().split("T")[0];
  };

  const fetchSuggestions = debounce(async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await getCompanySuggestions(query);
      const rawSuggestions = response.data || response;
      const uniqueByCompany = rawSuggestions.filter(
        (item: any, index: number, self: any[]) =>
          index === self.findIndex(
            (s) => s.company_name?.toLowerCase() === item.company_name?.toLowerCase()
          )
      );
      setSuggestions(uniqueByCompany);
    } catch (error) {
      console.error("Failed to fetch company suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, 300);

  useEffect(() => {
    if (id || claimID) {
      const fetchOwner = async () => {
        try {
          const EnginerDetails = await gettingEnginerDetails(id || claimID);
          setData(EnginerDetails);
          handleSetInitialValues(EnginerDetails);
        } catch (err) {
          console.error("Error fetching vehicle owner details:", err);
        }
      };
      fetchOwner();
    } else {
      console.warn("⚠️ No id found in route params. Check your <Route path> definition.");
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
    const storedClaimId = id || claimID;
    try {
      const payload = {
        company_name: values.companyName,
        vehicle_payment_beneficiary: values.vehicle_payment_beneficiary,
        reference: values.reference,
        currency: values.currency,
        actual_fee: Number(values.actual_fee),
        invoice_received_on: formatCalendarDate(invoiceReceivedOn),
        invoice_paid_on: formatCalendarDate(invoicePaidOn),
        invoice_settled_on: formatCalendarDate(invoiceSettledOn),
        invoice_settled_amount: Number(values.invoice_settled_amount),
        engineer_report_received: engineer_report_received === true,
        engineer_instructed: formatCalendarDate(engineerInstructed),
        inspection_date: formatCalendarDate(inspectionDate),
        engineer_report_received_date: formatCalendarDate(engineerReportReceivedDate),
        engineer_fee: Number(values.engineer_fee),
        site: values.site,
        claim_id: storedClaimId,
        engineer_address: {
          address: values.engineer_address.address,
          postcode: values.engineer_address.postcode,
          mobile_tel: values.engineer_address.landline_tel,
          email: values.engineer_address.email
        },
        vehicle_address: {
          address: values.vehicle_address.address,
          postcode: values.vehicle_address.postcode,
          mobile_tel: values.vehicle_address.mobile_tel,
          email: values.vehicle_address.email
        }
      };

      if((claimID || id) && isEditing === true) {
        await udpateEnginerDetails(payload, claimID || id);
        toast.success("Engineer Details saved successfully");
      } else{
        await EngineerDetailsApi.createEngineerDetails(payload);
        toast.success("Engineer Details saved successfully");
      }
      if(engineer_report_received === true){
        if (handleNext) handleNext(8, "next");
      } else{
        if (handleNext) handleNext(9, "next");
      }
    } catch (e) {
      toast.error("Unable to save engineer details");
    }
  };

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      if (formikRef.current) {
        await formikRef.current.submitForm();
        if (formikRef.current.isValid) {
          return true;
        } else {
          throw new Error('Form validation failed');
        }
      }
      throw new Error('Form not available');
    },
  }));

  const handleSetInitialValues = (response: any) => {
    const EngineerDetails = response;
    dispatch(setEngineerReportReceived(EngineerDetails.engineer_report_received));
    setInitialValues((prev) => ({
      ...prev,
      companyName: EngineerDetails.company_name || "",
      vehicle_payment_beneficiary: EngineerDetails.vehicle_payment_beneficiary || "",
      reference: EngineerDetails.reference || "",
      currency: EngineerDetails.currency || "GBP",
      actual_fee: EngineerDetails.actual_fee || 0,
      invoice_received_on: EngineerDetails.invoice_received_on || "",
      invoice_paid_on: EngineerDetails.invoice_paid_on || "",
      invoice_settled_on: EngineerDetails.invoice_settled_on || "",
      invoice_settled_amount: EngineerDetails.invoice_settled_amount || 0,
      engineer_report_received: engineer_report_received || false,
      engineer_instructed: EngineerDetails.engineer_instructed || "",
      inspection_date: EngineerDetails.inspection_date || "",
      engineer_report_received_date: EngineerDetails.engineer_report_received_date || "",
      engineer_fee: EngineerDetails.engineer_fee || 0,
      site: EngineerDetails.site || "",
      claim_id: EngineerDetails.claim_id || "",
      tenant_id: EngineerDetails.tenant_id || "",
      engineer_address: {
        address: EngineerDetails.engineer_address?.address || "",
        postcode: EngineerDetails.engineer_address?.postcode || "",
        landline_tel: EngineerDetails.engineer_address?.mobile_tel || "",
        mobile_tel: EngineerDetails.engineer_address?.mobile_tel || "",
        email: EngineerDetails.engineer_address?.email || "",
        id: EngineerDetails.engineer_address?.id || "",
      },
      vehicle_address: {
        address: EngineerDetails.vehicle_address?.address || "",
        postcode: EngineerDetails.vehicle_address?.postcode || "",
        mobile_tel: EngineerDetails.vehicle_address?.mobile_tel || "",
        email: EngineerDetails.vehicle_address?.email || "",
        id: EngineerDetails.vehicle_address?.id || "",
      },
    }));
  };


  const parseDateInspection = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const [day, month, year] = dateStr.split("-").map(Number);
    return new CalendarDate(year, month, day);
  };
  

  const handleUpload = async (uploadedFiles: any) => {
    setConfirming(true);
    try {
      const response = await uploadVCEngineer(uploadedFiles);
      setUploadModal(false);
      dispatch(setOcrEngineer((response?.engineer_detail[0])))
  
      const inspectionDate = parseDateInspection(response?.engineer_detail[0]?.inspection_date)
      const receivedDate = parseDateInspection(response?.engineer_detail[0]?.engineer_report_received_date)
      const intructedDate = parseDateInspection(response?.engineer_detail[0]?.engineer_instructed)
      if (inspectionDate) {
        setInitialValues((prev) => ({
          ...prev,
          inspection_date: inspectionDate,
          engineer_instructed: intructedDate,
          engineer_report_received_date: receivedDate,
          engineer_fee: response?.engineer_detail[0]?.engineer_fee
        }));
        setInspectionDate(inspectionDate);
        setEngineerReportReceivedDate(receivedDate)
        setEngineerInstructed(intructedDate)
  
        toast.success('File uploaded successfully');
      } else {
        toast.error('Inspection date not available in the uploaded file');
      }
    } catch (e) {
      toast.error('Unable to upload file');
    } finally {
      setConfirming(false);
    }
  };
  

  const handleInstructEngineer = async (values: any) => {
    setInstructing(true)
    try{
      const payload = {
        email: values.engineer_address.email,
        company: values.companyName,
        address: values.engineer_address.address,
        postCode: values.engineer_address.postcode,
        location: values.vehicle_address.address
      }
      await instructEngineer(payload, id || claimID)
      toast.success('Email sent with instructions')
    } catch(e){
      toast.error('Unable to send email')
    } finally{
      setInstructing(false)
    }
  }

  const handleRadioChange = (value: boolean) => {
    dispatch(setEngineerReportReceived(value));
  };

  const checkRequiredFields = (values: object) => {
    return (
      values.companyName &&
      values.engineer_address.address &&
      values.engineer_address.postcode &&
      values.engineer_address.landline_tel &&
      values.engineer_address.email &&
      values.vehicle_payment_beneficiary &&
      values.reference && values.vehicle_address?.address
    );
  };

  return (
    <>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => {
          const handleSelect = (company: Company) => {
            const newValues = {
              address: company.address || "",
              companyName: company.company_name || "",
              email: company.contact_email || "",
              contactName: company.contact_name || "",
              contactTelephone: company.contact_number || "",
              postcode: company.postcode || "",
              telephoneMain: company.primary_contact_number || "",
            };
          
            const engineerAddress = {
              address: company.address || "",
              postcode: company.postcode || "",
              landline_tel: company.contact_number || "",
              email: company.contact_email || "",
            };
          
            Object.entries(newValues).forEach(([key, value]) => {
              setFieldValue(key, value);
            });
          
            setInitialValues((prev) => ({
              ...prev,
              engineer_address: engineerAddress,
              ...newValues,
            }));
          
            setSuggestions([]);
            setTyping(false);
          };
          
          return (
            <Form className="m-4 bg-white p-0">
              <div className='flex justify-between items-center'>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 mb-2">Engineer Details</h1>
                  <p className="text-sm text-gray-600 mb-4 sm:text-sm sm:mb-6">Enter the client vehicle details below.</p>
                </div>
                <div className='flex gap-4 items-center'>
                  <button
                    type="button"
                    onClick={() => { 
                      handleInstructEngineer(values)
                    }}
                    disabled={!checkRequiredFields(values)}
                    className={`${!checkRequiredFields(values) ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'} px-4 py-2 bg-white-600 text-gray-800 rounded-lg  focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors`}
                  >
                    {instructing ? 'Sending Email' : 'Intruct Engineer'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="w-[100%]">
                  <Field name="companyName">
                    {({ field, form, meta }: any) => {
                      const options = suggestions.map((c: any) => ({
                        value: c.id,
                        label: c.company_name,
                      }));

                      return (
                        <div
                          className="flex flex-col mt-2 sm:flex-row sm:items-center"
                          style={{ height: "100px" }}
                        >
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Company Name
                          </label>
                          <div className="w-full ml-2 sm:w-3/4 relative">
                            <CustomSelect
                              options={options}
                              value={
                                form.values.companyName
                                  ? { value: form.values.companyName, label: form.values.companyName }
                                  : null
                              }
                              onInputChange={(inputValue, { action }) => {
                                if (action === "input-change") {
                                  fetchSuggestions(inputValue)
                                  form.setFieldValue("companyName", inputValue);
                                  setTyping(true);
                                }
                              }}
                              onChange={(option) => {
                                if (option) {
                                  form.setFieldValue("companyName", option.label);
                                  const selectedCompany = suggestions.find(
                                    (c: any) => c.id === option.value
                                  );
                                  if (selectedCompany) {
                                    handleSelect(selectedCompany);
                                  }
                                } else {
                                  form.setFieldValue("companyName", "");
                                }
                              }}
                              placeholder="Type company name"
                              disabled={isClosed}
                            />
                            {loadingSuggestions && (
                              <div className="absolute right-3 top-2 text-gray-400 text-sm">
                                Loading...
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  </Field>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="w-full sm:w-3/4">
                      <LeafletAutocompleteMap
                        showMap={false}
                        apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                        address={initialValues.engineer_address.address}
                        onPlaceSelected={(place) => {
                          if (place.name) {
                            setFieldValue("engineer_address.address", place.address);
                            setFieldValue("engineer_address.postcode", place?.postalCode);
                          }
                        }}
                        disabled={isClosed}
                      />
                      <ErrorMessage name="engineer_address.address" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Postcode
                    </label>
                    <div className="relative w-full sm:w-3/4">
                      <Field
                        name="engineer_address.postcode"
                        type="text"
                        style={{ height: '44px' }}
                        disabled={isClosed}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                      />
                      <ErrorMessage name="engineer_address.postcode" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Telephone
                    </label>
                    <div className="w-full sm:w-3/4">
                      <Field name="engineer_address.landline_tel">
                        {({ field, form, meta }: any) => (
                          <div className="w-full sm:w-3/4">
                            <PhoneInput
                              country="gb"
                              value={field.value}
                              onChange={(value) => form.setFieldValue(field.name, value)}
                              inputStyle={{ width: "820px", height: "44px" }}
                              disabled={isClosed}
                            />
                            {meta.touched && meta.error && (
                              <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative w-full sm:w-3/4">
                      <Field
                        type="email"
                        name="engineer_address.email"
                        disabled={isClosed}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                      />
                      <div className="absolute right-3 top-[22px] transform -translate-y-1/2 text-gray-500">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Vehicle Payment Beneficiary
                    </label>
                    <div className="relative w-full sm:w-3/4">
                      <Field
                        type="text"
                        name="vehicle_payment_beneficiary"
                        
                        disabled={isClosed}
                        placeholder="Enter beneficiary name"
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Reference
                    </label>
                    <div className="relative w-full sm:w-3/4">
                      <Field
                        type="text"
                        name="reference"
                        disabled={isClosed}
                        placeholder="Enter Reference Number"
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="mb-4 sm:mb-6 mt-6" />

              <h1 className="text-lg font-semibold text-gray-900 mb-2">Vehicle Location</h1>
              <p className="text-sm text-gray-600 mb-4 sm:text-sm sm:mb-6">Enter the borough details below.</p>

              <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Site
                </label>
                <div className="relative w-full sm:w-3/4">
                  <Field
                    type="text"
                    name="site"
                    disabled={isClosed}
                    placeholder=""
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4 mt-7">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="w-full sm:w-3/4">
                  <LeafletAutocompleteMap
                    showMap={false}
                    apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                    address={initialValues.vehicle_address.address}
                    onPlaceSelected={(place) => {
                      if (place.name) {
                        setFieldValue("vehicle_address.address", place.address);
                        setFieldValue("vehicle_address.postcode", place?.postalCode);
                      }
                    }}
                    disabled={isClosed}
                  />
                  <ErrorMessage name="vehicle_address.address" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <div className="relative w-full sm:w-3/4">
                  <Field
                    name="vehicle_address.postcode"
                    type="text"
                    style={{ height: '44px' }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                  />
                  <ErrorMessage name="vehicle_address.postcode" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              <hr className="mb-4 sm:mb-6 mt-8" />

              <div className="w-[98%] bg-white border-b border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Engineer Fees</h2>
                  <p className="text-sm mb-2 text-gray-600">Enter engineer fees details</p>
                </div>

                <div className="py-6 w-[102%]">
                  <div className="grid gap-8">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                        <label className="w-full mr-4 sm:w-1/4 text-sm font-medium text-gray-700">
                          Actual Fee
                        </label>
                        <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                          <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                            <div className="flex items-center px-2 sm:px-3 rounded-lg">
                              <span className="text-sm sm:text-base">£</span>
                            </div>
                            <Field
                              name="actual_fee"
                              type="number"
                              step="0.01"
                              style={{ height: '44px' }}
                              disabled={isClosed}
                              className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                            />
                            <div className="relative w-16 sm:w-20">
                              <select className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                                <option>GBP</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                        <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                          Invoice Received On
                        </label>
                        <div className="w-[81%]">
                          <Field name="invoice_received_on">
                            {({ field, form }: any) => (
                              <DatePicker isDisabled={isClosed} value={invoiceReceivedOn} onChange={setInvoiceReceivedOn} className="mt-1 z-50" />
                            )}
                          </Field>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                        <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                          Invoice Paid On
                        </label>
                        <div className="w-[81%]">
                          <Field name="invoice_paid_on">
                            {({ field, form }: any) => (
                              <DatePicker isDisabled={isClosed} value={invoicePaidOn} onChange={setInvoicePaidOn} className="mt-1 z-50" />
                            )}
                          </Field>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                        <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                          Invoice Settled On
                        </label>
                        <div className="w-[81%]">
                          <Field name="invoice_settled_on">
                            {({ field, form }: any) => (
                              <DatePicker isDisabled={isClosed} value={invoiceSettledOn} onChange={setInvoiceSettledOn} className="mt-1 z-50" />
                            )}
                          </Field>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                        <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                          Invoice Settled Amount
                        </label>
                        <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                          <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                            <div className="flex items-center px-2 sm:px-3 rounded-lg">
                              <span className="text-sm sm:text-base">£</span>
                            </div>
                            <Field
                              name="invoice_settled_amount"
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex justify-between w-full'>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 mb-2">Engineer Report & Instructions Details</h1>
                    <p className="text-sm text-gray-600 mb-4 sm:text-sm sm:mb-6">Enter the third party vehicle details below.</p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setUploadModal(true)}
                      className="px-4 ml-96 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Upload Report
                    </button>
                  </div>
                </div>

                <hr />

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6 mt-7">
                  <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                    Engineer Report Received?
                  </label>
                  <div className="w-full sm:w-3/4 flex gap-4 ml-4">
                    <label className="flex items-center">
                      <Field
                        type="radio"
                        name="engineer_report_received"
                        value="true"
                        checked={engineer_report_received === true}
                        onChange={() => handleRadioChange(true)}
                        disabled={isClosed}
                        className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <Field
                        type="radio"
                        name="engineer_report_received"
                        value="false"
                        checked={engineer_report_received === false}
                        onChange={() => handleRadioChange(false)}
                        disabled={isClosed}
                        className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
                {engineer_report_received === true ? <div className='flex justify-start ml-72'>
                  <div className='flex cursor-pointer' onClick={() => {
                    if(handleNext) {
                      handleNext(8, 'next')
                    }
                  }}>
                    <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Repair Costs & Route Details</h2>
                    <MdArrowOutward className='text-[#414651] mt-[3px] ml-1' />
                  </div>
                  <div className='flex cursor-pointer ml-4' onClick={() => {
                    if(handleNext){
                      handleNext(9, "next")
                    }
                  }}>
                    <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">Total Loss Details</h2>
                    <MdArrowOutward className='text-[#414651] mt-[3px] ml-1' />
                  </div>
                </div> : null}
                

                <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                  <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                    Engineer Instructed
                  </label>
                  <div className="w-[81%]">
                    <Field name="engineer_instructed">
                      {({ field, form }: any) => (
                        <DatePicker isDisabled={isClosed} value={engineerInstructed} onChange={setEngineerInstructed} className="mt-1 z-50" />
                      )}
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                  <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                    Inspection Date
                  </label>
                  <div className="w-[81%]">
                    <Field name="inspection_date">
                      {({ field, form }: any) => (
                        <DatePicker isDisabled={isClosed} value={inspectionDate} onChange={(date: Date) => {
                          setInspectionDate(date);
                          form.setFieldValue("inspection_date", date);
                        }} className="mt-1 z-50" />
                      )}
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                  <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                    Engineer’s Report Received
                  </label>
                  <div className="w-[81%]">
                    <Field name="engineer_report_received_date">
                      {({ field, form }: any) => (
                        <DatePicker isDisabled={isClosed} value={engineerReportReceivedDate} onChange={setEngineerReportReceivedDate} className="mt-1 z-50" />
                      )}
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                  <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                    Engineer’s Fee
                  </label>
                  <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                    <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                      <div className="flex items-center px-2 sm:px-3 rounded-lg">
                        <span className="text-sm sm:text-base">£</span>
                      </div>
                      <Field
                        name="engineer_fee"
                        type="number"
                        step="0.01"
                        style={{ height: '44px' }}
                        disabled={isClosed}
                        className="flex-1 p-2 sm:p-3 text-sm sm:text-base"
                      />
                      <div className="relative w-16 sm:w-20">
                        <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                          <option>GBP</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          )

        }}
      </Formik>

      <UploadCSV5Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        onUpload={handleUpload}
        confirming={confirming}
      />

      <Modal
        open={vehicleModal}
        onClose={() => setVehicleModal(false)}
        classNames={{ overlay: 'custom-overlay', modal: 'custom-modal' }}
        closeIcon={<FaTimes size={2} className="text-[#717680] font-normal w-5 h-5" />}
      >
        <h2 className="text-[16px] mb-4 text-center">Car Check</h2>
        <hr />
        <iframe
          src="https://www.carcheck.co.uk/"
          width="100%"
          height="700"
          title="Car Check"
          className="border-none"
        ></iframe>
      </Modal>

      <Modal
        open={dvlaModal}
        onClose={() => setDvlaModal(false)}
        classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}
        closeIcon={<FaTimes size={2} className="text-[#717680] font-normal w-5 h-5" />}
      >
        <h2 className="text-[16px] text-center flex-1">DVLA</h2>
        <hr />
        <iframe
          src="https://www.gov.uk/view-driving-licence"
          width="100%"
          height="100%"
          title="Car Check"
          className="border-none"
        ></iframe>
      </Modal>

      <Modal
        open={midModal}
        onClose={() => setMidModal(false)}
        classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}
        closeIcon={<FaTimes size={2} className="text-[#717680] font-normal w-5 h-5" />}
      >
        <h2 className="text-[16px] text-center flex-1">Process MID</h2>
        <hr />
        <iframe
          src="https://www.askmid.com/"
          width="100%"
          height="100%"
          title="Car Check"
          className="border-none"
        ></iframe>
      </Modal>
    </>
  );
});

EngineerDetails.displayName = 'EngineerDetails';

export default EngineerDetails;