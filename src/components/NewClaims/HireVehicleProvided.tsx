import "react-phone-input-2/lib/style.css";
import Label from "../common/label";
import { getLocalTimeZone, today } from "@internationalized/date";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import { ErrorMessage, Field, Formik } from "formik";
import { useParams } from "react-router-dom";
import { DatePicker } from "../application/date-picker/date-picker";
import CustomSelect from "../ReactSelect/ReactSelect";
import { debounce } from "lodash";
import { useSelector } from "react-redux";
import type { DateValue } from "react-aria-components";
import { createPanelSolicitors, getPanelSolicitorDetails, updatePanelSolicitors } from "../../services/PanelSolicitorDetails/PanelSolicitorDetails";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { getHireVehicleStatus, sendEmailOnHire } from "../../services/HireVehicleProvided/HireVehicleProvided";
import { Table, TableCard } from "../../components/application/table/table.tsx";

function openOutlookCompose(to: string, subject: string, body: string) {

  const encodedTo = encodeURIComponent(to);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const officeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  const liveUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  const mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;

  const newTab = window.open(officeUrl, "_blank");

  if (!newTab) {
      window.location.href = mailtoUrl;
      return;
  }

  setTimeout(() => {
      try {
          window.open(liveUrl, "_blank");
      } catch (e) {
          console.warn("Live URL popup blocked or failed", e);
      }
  }, 1000);
}


const validationSchema = Yup.object().shape({
  company_name: Yup.string().required("Company name is required"),
  reference: Yup.string().required("Reference is required"),
  recommendation_sent: Yup.mixed(),//.required("Recommendation sent date is required"), // allow date obj
  note: Yup.string().required("Note is required"),
  claim_id: Yup.number().required("Claim ID is required"),

  email_sent_date: Yup.string().nullable(),   // not required
  accepted_sent_date: Yup.string().nullable(), // not required

  // New fields for HireVehicleProvided
  cross_hired: Yup.string().nullable(),
  provider_name: Yup.string().nullable(),
  contract: Yup.string().nullable(),
  rates: Yup.string().nullable(),
  hire_vehicle_status: Yup.string().nullable(),
  hire_vehicle_registration: Yup.string().nullable(),
  make: Yup.string().nullable(),
  model: Yup.string().nullable(),
  fuel_type: Yup.string().nullable(),
  plate_transfer: Yup.boolean().nullable(),

  address: Yup.object().shape({
    address: Yup.string().required("Address is required"),
    postcode: Yup.string().required("Postcode is required"),
    mobile_tel: Yup.string().required("Mobile number is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
  }),
});

export interface PanelSolicitorDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
}
export interface Address {
  address: string;
  postcode: string;
  mobile_tel: string;
  email: string;
}
    
export interface Company {
  company_name: string;
  reference: string;
  recommendation_sent: string;
  note: string;
  claim_id: number;
  email_sent_date: string;
  accepted_sent_date: string;
  address: Address;
}

const HireVehicleProvided = forwardRef(
  ({ handleNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');
    const {id} = useParams()
    const [hireVehicleStatus, setHireVehicleStatus] = useState([]);
    const [hireVehicleStatusLoading, setHireVehicleStatusLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [typing, setTyping] = useState(false);
    const now = today(getLocalTimeZone());
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [hireStartDate, setHireStartDate] = useState<DateValue | null>(now)  
    const [hireEndDate, setHireEndDate] = useState<DateValue | null>(now)  
    const { isClosed } = useSelector((state: any) => state.isClosed)
    const formikRef = useRef<any>(null);

      const fetchHireVehicleStatus = debounce(async (query: string) => {
      if (!query) {
        setHireVehicleStatus([]);
        return;
      }
      setHireVehicleStatusLoading(true);
      try {
        const response = await getHireVehicleStatus(query);
        const rawSuggestions = response.data || response;

        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.hire_vehicle_status?.toLowerCase() ===
                item.hire_vehicle_status?.toLowerCase()
            )
        );

        setHireVehicleStatus(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch hire vehicle status:", error);
        setHireVehicleStatus([]);
      } finally {
        setHireVehicleStatusLoading(false);
      }
    }, 300);
    const [initialValues, setInitialValues] = useState({
      company_name: "",
      reference: "",
      recommendation_sent: "",
      note: "",
      claim_id: claimID || 0,
      email_sent_date: "",
      accepted_sent_date: "",
      cross_hired: "",
      provider_name: "",
      contract: "",
      rates: "",
      hire_vehicle_status: "",
      hire_vehicle_registration: "",
      make: "",
      model: "",
      fuel_type: "",
      plate_transfer: false,
      address: {
        address: "",
        postcode: "",
        mobile_tel: "",
        email: "",
      },
    });


    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          if (currentClaimId) {
            await fetchPanelSolicitosDetails(currentClaimId);
          }
        };
        loadData();
      }
    }, [id, claimID]);

    const fetchPanelSolicitosDetails = async (claim_id: string) => {
      try {
        setIsLoading(true);
        const response = await getPanelSolicitorDetails(claim_id);
        const panelSolicitors = response.data || response;
        if (panelSolicitors) {
          setIsEditing(true);
          setInitialValues((prev) => ({
            ...prev,     
            company_name: panelSolicitors.company_name,
            reference: panelSolicitors.reference,
            recommendation_sent: panelSolicitors.recommendation_sent,
            note: panelSolicitors.note,
            claim_id: claimID || 0,
            email_sent_date: panelSolicitors.email_sent_date,
            accepted_sent_date: panelSolicitors.accepted_sent_date,
            address: {
              address: panelSolicitors.address.address,
              postcode: panelSolicitors.address.postcode,
              mobile_tel: panelSolicitors.address.mobile_tel,
              email: panelSolicitors.address.email,
            }, 
          
          }));
        }
      } catch (error) {
        console.error('Error fetching referrer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const formatDate = (val: string | Date | null) => {
      if (!val) return null;
      const d = new Date(val);
      return d.toISOString().split("T")[0];
    };

    const handleSubmit =async (values: any, key: string) => {
      try {
        const storedClaimId = claimID || id;
        const payload = {
          company_name: values.company_name,
          reference: values.reference,
          recommendation_sent: values.recommendation_sent,
          note: values.note,
          claim_id: storedClaimId,
          email_sent_date: "2025-10-06",   //remove from back end
          accepted_sent_date: "2025-10-06", //remove from back end
          hire_start_date: formatDate(hireStartDate),  
          hire_end_date: formatDate(hireEndDate),
          cross_hired: values.cross_hired,
          provider_name: values.provider_name,
          contract: values.contract,
          rates: values.rates,
          hire_vehicle_status: values.hire_vehicle_status,
          hire_vehicle_registration: values.hire_vehicle_registration,
          make: values.make,
          model: values.model,
          fuel_type: values.fuel_type,
          plate_transfer: values.plate_transfer,
          address: {
            address: values.address.address,
            postcode: values.address.postcode,
            mobile_tel: values.address.mobile_tel,
            email: values.address.email,
          },
        };

        let response;
        if (storedClaimId && isEditing) {
          response = await updatePanelSolicitors(payload, storedClaimId, key);
        } else {
          response = await createPanelSolicitors(payload, key);
        }
  
        toast.success('Panel Solicitors Details saved successfully')
  
        // if (onSuccess) {
        //   onSuccess();
        // }       
        if(handleNext){
          handleNext(11, 'next')
        }
      } catch (error: any) {
        toast.error('Unable to save panel solicitor details')
        console.error('Error submitting form:', error);
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
    
    return (
      <div className=" sm:pt-8 pb-8 sm:pb-12 sm:pl-6 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          innerRef={formikRef}
          enableReinitialize
        > {({ values, setFieldValue }: any) => {

          const handleQuestionnaireSend = async (
            email: string,
            sendReminders: boolean,
            option: any
        ) => {
            const firstName = values.company_name || "Client";
            const now = new Date();
            const formattedDate = now.toISOString().split("T")[0];
            const formattedTime = now.toTimeString().split(" ")[0].substring(0, 5);
            // setLoading(true)
            try {
                // const res = await sendEmailOnHire(
                //     email,
                //     claimID || id || "1",
                //     firstName,
                //     values.reference || "123",
                //     option
                // );

                // if (res?.link) {
                    const subject = "Inst fleet to On Hire";
                    const body =
                        `Dear ${firstName},\n\n` +
                        `Please use the following secure link to complete the questionnaire:\n\n` +
                        `<Link here>\n\n` +
                        `Claim Reference: ${values.reference || "N/A"}\n` +
                        `Client Name: ${firstName}\n` +
                        `Address: ${option || "N/A"}\n` +
                        `Date: ${formattedDate}\n\n` +
                        `Regards,\nClaims Team`;

                    openOutlookCompose(email, subject, body);
                    toast.success('Email sent successfully')
                // } else if (res?.zip_base64) {
                //     handleDownload(res)
                //     toast.success('Form and letter downloaded successfully')
                // }
                // setFieldValue("questionnaireSentDate", formattedDate);
                // setFieldValue("questionnaireSentTime", formattedTime);

            } catch (e) {
                console.error("Unable to send email / open compose:", e);
                toast.error('Failed to send email');
            } finally {
                // setIsQuestionnaireModalOpen(false);
                // setLoading(false)
            }
        };

          const handleSelect = (company: any) => {
            const newValues = {
              company_name: company.company_name || "",
              address: {
                address: company.address || "",
                postcode: company.postcode || "",
                mobile_tel: company.contact_number || "",
                email: company.contact_email || "",
              },
            };

            // 1) Update Formik live values
            Object.entries(newValues).forEach(([key, value]) => {
              
              if (key === "address" && typeof value === "object") {
                Object.entries(value).forEach(([subKey, subValue]) => {
                  setFieldValue(`address.${subKey}`, subValue);
                });
              } else {
                setFieldValue(key, value);
              }
            });

            // 2) Update initial values (reinitialize)
            setInitialValues((prev) => ({
              ...prev,
              company_name: company.company_name,
              address: newValues.address
            }));
            setSuggestions([]);
            setTyping(false);
          };
          
          return (
          <>
  <div className="border-b border-cloudGray mb-5">
            <h2 className="text-secondary text-lg font-semibold">
              Hire Vehicle Provided Details
            </h2>
            <p className="pb-5 text-lightGray text-sm font-normal">Enter details for Hire Vehicle Provided Details</p>
          </div>
          <form className="space-y-4 mb-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="company_name">Inst fleet to On Hire</Label>
              </div>
              <div>
            

              <button
                type="button"
                onClick={() => handleQuestionnaireSend("test@gmail.com", true, values.address.address)}
                
                className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Inst fleet to On Hire
              </button>
              </div>
            </div>
            <div className="mt-8 border-t border-cloudGray" />
          </form>








          <div className="border-b border-cloudGray mb-5">
            <h2 className="text-secondary text-lg font-semibold">
              Hire Vehicle Provided Details
            </h2>
            <p className="pb-5 text-lightGray text-sm font-normal">Enter details for Hire Vehicle Provided Details</p>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="company_name">Has this Hire Vehicle been Cross-Hired to us?</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
              <div className="relative w-full">
                <Field name="cross_hired">
                  {({ field, form, meta }: any) => {
                    const crossHiredOptions = [
                      { value: "No", label: "No" },
                      { value: "Yes", label: "Yes" },
                    ];

                    return (
                      <div className="w-full">
                        <CustomSelect
                          options={crossHiredOptions}
                          value={
                            crossHiredOptions.find((opt) => opt.value === field.value) || null
                          }
                          onChange={(option) => {
                            form.setFieldValue(field.name, option ? option.value : "");
                          }}
                          placeholder="Select option"
                          // disabled={isClosed}
                        />

                        {meta.touched && meta.error && (
                          <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                        )}
                      </div>
                    );
                  }}
                </Field>
                      </div>
              </div>

              {/* Conditional fields when Cross-Hired is "Yes" */}
              {values.cross_hired === "Yes" && (
                <>
                  {/* Provider Name */}
                  <div className="col-span-3 lg:col-span-1">
                    <Label htmlFor="provider_name">Provider Name</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <Field
                      name="provider_name"
                      type="text"
                      style={{ height: '44px' }}
                      disabled={isClosed}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                    />
                    <ErrorMessage name="provider_name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  {/* Contract */}
                  <div className="col-span-3 lg:col-span-1">
                    <Label htmlFor="contract">Contract</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <Field
                      name="contract"
                      type="text"
                      style={{ height: '44px' }}
                      disabled={isClosed}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                    />
                    <ErrorMessage name="contract" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  {/* Rates */}
                  <div className="col-span-3 lg:col-span-1">
                    <Label htmlFor="rates">Rates</Label>
                  </div>
                  <div className="col-span-3 lg:col-span-2">
                    <Field
                      name="rates"
                      type="text"
                      style={{ height: '44px' }}
                      disabled={isClosed}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                    />
                    <ErrorMessage name="rates" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </>
              )}

             {/* Client Vehicle Category */}
              <div className="col-span-3 lg:col-span-1">
                <Label
                  htmlFor={`hire_vehicle_status`}
                >
                  Hire Vehicle Status
                </Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <Field
                  name={`hire_vehicle_status`}
                >
                  {({ form }: any) => {
                    const options = hireVehicleStatus.map(
                      (c: any) => ({
                        value: c.id,
                        label: c.hire_vehicle_status,
                      })
                    );

                    return (
                      <>
                        <CustomSelect
                          key={`hire_vehicle_status`}
                          options={options}
                          value={
                            form.values.hire_vehicle_status?.hire_vehicle_status
                              ? {
                                  value:
                                    form.values
                                    .hire_vehicle_status,
                                  label:
                                    form.values
                                      .hire_vehicle_status,
                                    
                                }
                              : null
                          }
                          onInputChange={(
                            inputValue: any
                          ) => {
                            if (inputValue) {
                              fetchHireVehicleStatus(
                                inputValue
                              );
                            }
                          }}
                          onChange={(option) => {
                            if (option) {
                              form.setFieldValue(
                                `hire_vehicle_status`,
                                option.label
                              );
                              const selectedCompany =
                                hireVehicleStatus.find(
                                  (c: any) =>
                                    c.id === option.value
                                );
                              if (selectedCompany) {
                                handleSelect(
                                  selectedCompany,
                                
                                );
                              }
                            } else {
                              form.setFieldValue(
                                `hire_vehicle_status`,
                                ""
                              );
                            }
                          }}
                          placeholder="Type hire vehicle status"
                          disabled={isClosed}
                        />
                        {hireVehicleStatusLoading && (
                          <div className="absolute right-3 top-2 text-gray-400 text-sm">
                            Loading...
                          </div>
                        )}
                      </>
                    );
                  }}
                </Field>
              </div>



              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="hire_vehicle_registration">Hire Vehicle Registration</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <Field
                  name="hire_vehicle_registration"
                  type="text"
                  style={{ height: '44px' }}
                  disabled={isClosed}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                />
                <ErrorMessage name="hire_vehicle_registration" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="make">Make</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <Field
                  name="make"
                  type="text"
                  style={{ height: '44px' }}
                  disabled={isClosed}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                />
                <ErrorMessage name="make" component="div" className="text-red-500 text-xs mt-1" />
              </div>



              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="make">Model</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <Field
                  name="model"
                  type="text"
                  style={{ height: '44px' }}
                  disabled={isClosed}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                />
                <ErrorMessage name="model" component="div" className="text-red-500 text-xs mt-1" />
              </div>







              

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="hire_start_date">Hire Start Date</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                <Field name="hire_start_date">
                  {({ form }: any) => (
                    <DatePicker
                      maxValue={today(getLocalTimeZone())}
                      isDisabled={isClosed}
                      value={hireStartDate}
                      onChange={(newDate) => {
                        setHireStartDate(newDate);
                        form.setFieldValue("hire_start_date", newDate);
                      }}
                      className="w-full"
                    />
                  )}
                </Field>
                </div>
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="hire_end_date">Hire End Date</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                <Field name="hire_end_date">
                  {({ form }: any) => (
                    <DatePicker
                      maxValue={today(getLocalTimeZone())}
                      isDisabled={isClosed}
                      value={hireEndDate}
                      onChange={(newDate) => {
                        setHireEndDate(newDate);
                        form.setFieldValue("hire_end_date", newDate);
                      }}
                      className="w-full"
                    />
                  )}
                </Field>
                </div>
              </div>


              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="fuel_type">Fuel Type</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <Field
                  name="fuel_type"
                  type="text"
                  style={{ height: '44px' }}
                  disabled={isClosed}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                />
                <ErrorMessage name="fuel_type" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="col-span-3 lg:col-span-1">
                          <Label htmlFor="plate_transfer">Plate Transfer</Label>
                        </div>
                        <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                          <label className="flex items-center">
                            <Field
                              type="checkbox"
                              name="plate_transfer"
                              disabled={isClosed}
                              className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                        </div>

            </div>
            <div className="mt-8 border-t border-cloudGray" />
          </form>

          {/* Vehicle Table */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h3>
            <TableCard.Root size="sm" className="border border-gray-200 rounded-lg overflow-hidden">
              <Table
                aria-label="Vehicle Details"
              >
                <Table.Header className="bg-gray-100 text-gray-700">
                  <Table.Head id="registration" label="Registration" isRowHeader />
                  <Table.Head id="make" label="Make" />
                  <Table.Head id="model" label="Model" />
                  <Table.Head id="hire_start" label="Hire Start" />
                  <Table.Head id="hire_end" label="Hire End" />
                </Table.Header>

                <Table.Body items={[
                  {
                    id: 1,
                    registration: values.hire_vehicle_registration || "AB12 CDE",
                    make: values.make || "Toyota",
                    model: values.model || "Corolla",
                    hire_start: hireStartDate ? hireStartDate.toString() : "2024-01-15",
                    hire_end: hireEndDate ? hireEndDate.toString() : "2024-01-25"
                  }
                ]}>
                  {(vehicle) => (
                    <Table.Row
                      id={vehicle.id.toString()}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                        {vehicle.registration}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                        {vehicle.make}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                        {vehicle.model}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                        {vehicle.hire_start}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                        {vehicle.hire_end}
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </TableCard.Root>
          </div>
          
          </>
        )

          }}
        </Formik>
      </div>
    );
  }
);

HireVehicleProvided.displayName = "HireVehicleProvided";

export default HireVehicleProvided;
