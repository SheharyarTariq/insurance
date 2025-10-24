import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import Label from "../common/label";
import TopRightIcon from "../common/top-right-icon";
import GoogleMapAutocomplete from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import CustomSelect from "../ReactSelect/ReactSelect";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { ErrorMessage, Field, Formik } from "formik";
import { useParams } from "react-router-dom";
import { config } from "../../../config";
import { DatePicker } from "../application/date-picker/date-picker";
import { debounce } from "lodash";
import { getCompanySuggestions } from "../../services/Referrer/Referrer";
import { useSelector } from "react-redux";
import type { DateValue } from "react-aria-components";
import { createPanelSolicitors, getPanelSolicitorDetails, updatePanelSolicitors } from "../../services/PanelSolicitorDetails/PanelSolicitorDetails";
import { toast } from "react-toastify";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  company_name: Yup.string().required("Company name is required"),
  reference: Yup.string().required("Reference is required"),
  recommendation_sent: Yup.mixed(),//.required("Recommendation sent date is required"), // allow date obj
  note: Yup.string().required("Note is required"),
  claim_id: Yup.number().required("Claim ID is required"),

  email_sent_date: Yup.string().nullable(),   // not required
  accepted_sent_date: Yup.string().nullable(), // not required

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

const PanelSolicitorDetails = forwardRef(
  ({ handleNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');
    const {id} = useParams()
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [typing, setTyping] = useState(false);
    const now = today(getLocalTimeZone());
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [date, setDate] = useState<DateValue | null>(now)  
    const { isClosed } = useSelector((state) => state.isClosed)
    const formikRef = useRef<any>(null);
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

    const [initialValues, setInitialValues] = useState({
      company_name: "",
      reference: "",
      recommendation_sent: "",
      note: "",
      claim_id: claimID || 0,
      email_sent_date: "",
      accepted_sent_date: "",
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
          recommendation_sent: formatDate(date),  
          note: values.note,
          claim_id: storedClaimId,
          email_sent_date: "2025-10-06",   //remove from back end
          accepted_sent_date: "2025-10-06", //remove from back end
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
        > {({ values, setFieldValue }) => {

          const handleSelect = (company) => {
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
              Panel Solicitor Details
            </h2>
            <p className="pb-5 text-lightGray text-sm font-normal">Enter details for Panel Solicitor</p>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="company_name">Company Name</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
              <Field name="company_name">
                {({ field, form, meta }: any) => {
                  const options = suggestions.map((c: any) => ({
                    value: c.id,
                    label: c.company_name,
                  }));

                  return (
                    <>
                      <CustomSelect
                        options={options}
                        value={
                          form.values.company_name
                            ? { value: form.values.company_name, label: form.values.company_name }
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
                    </>
                  );
                }}
              </Field>
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="address.address">Address</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <GoogleMapAutocomplete showMap={false} apiKey={config.apiGoogle} disabled={false} 
                  address={initialValues.address.address}
                  onPlaceSelected={(place) => {
                    if (place.name) {
                      setFieldValue("address", place.address);
                      setFieldValue("postcode", place?.postalCode)
                    }

                  }}/>
                  <ErrorMessage name="address.address" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="postcode">Postcode</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <Field
                  name="address.postcode"
                  type="text"
                  style={{ height: '44px' }}
                  disabled={isClosed}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                />
                <ErrorMessage name="address.postcode" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="telephone">Telephone Main</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
              <Field name="address.mobile_tel">
                {({ field, form, meta }: any) => (
                  <>
                    <PhoneInput
                      country="gb"
                      value={field.value}
                      disabled={isClosed}
                      inputStyle={{width: '700px', height: '44px'}}
                      onChange={(value) => form.setFieldValue(field.name, value)}
                    />
                    {meta.touched && meta.error && (
                      <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                    )}
                  </>
                )}
              </Field>
              <ErrorMessage name="address.mobile_tel" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="email">Email</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
              <Field
                name="address.email"
                type="email"
                style={{ height: '44px' }}
                disabled={isClosed}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
              />
              <div className="absolute right-3 top-1/3 transform -translate-y-1/2 text-gray-500">
                <a
                  href="https://outlook.office.com/mail/deeplink/compose?to=usaleem651@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* <Mail01 className="h-4 w-4" /> */}
                </a>
              </div>
              <ErrorMessage name="address.email" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="reference">Reference</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <Field
                  name="reference"
                  type="text"
                  style={{ height: '44px' }}
                  disabled={isClosed}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                />
                <ErrorMessage name="reference" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="recommendationDate">Recommendation Sent On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                <Field name="recommendation_sent">
                  {({ form }: any) => (
                    <DatePicker
                      maxValue={today(getLocalTimeZone())}
                      isDisabled={isClosed}
                      value={date}
                      onChange={(newDate) => {
                        setDate(newDate);
                        form.setFieldValue("recommendation_sent", newDate);
                      }}
                      className="w-full"
                    />
                  )}
                </Field>
                </div>
              </div>

              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="note">Note</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
              <Field
                as="textarea"
                name="note"
                rows={3}
                disabled={isClosed}
                placeholder="Describe what happened in detail..."
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 resize-none "
              />
              </div>

              <div className="col-span-3 lg:col-span-1" />
              
              <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                <div className="flex gap-1 text-xs text-custom hover:cursor-pointer hover:underline" onClick={() => handleSubmit(values, "send_email")}>
                  <p className="text-sm">Send signed documents to Panel Solicitor</p>
                  <TopRightIcon />
                </div>

                <div className="flex gap-1 text-xs text-custom hover:cursor-pointer hover:underline" onClick={() => handleSubmit(values, "send_acceptance_email")}>
                  <p className="text-sm">Claim Accepted by Panel Solicitor</p>
                  <TopRightIcon />
                </div>
              </div>

            </div>
            <div className="mt-8 border-t border-cloudGray" />
          </form>
          </>
        )

          }}
        </Formik>
      </div>
    );
  }
);

PanelSolicitorDetails.displayName = "PanelSolicitorDetails";

export default PanelSolicitorDetails;
