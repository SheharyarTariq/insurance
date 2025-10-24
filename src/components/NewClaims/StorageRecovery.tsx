import "react-phone-input-2/lib/style.css";
import Label from "../common/label";
import GoogleMapAutocomplete from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import CustomSelect from "../ReactSelect/ReactSelect";
import PhoneInput from "react-phone-input-2";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import { useParams } from "react-router-dom";
import { config } from "../../../config";
import { DatePicker } from "../application/date-picker/date-picker";
import { debounce } from "lodash";
import { useSelector } from "react-redux";
import type { DateValue } from "react-aria-components";
import { differenceInCalendarDays } from "date-fns";
import {
  createPanelSolicitors,
  getPanelSolicitorDetails,
  updatePanelSolicitors,
} from "../../services/PanelSolicitorDetails/PanelSolicitorDetails";
import { toast } from "react-toastify";
import { ChevronDown } from "lucide-react";
import {
  createStorageRecovery,
  getRecoveryProvider,
  getStorageProvider,
  getStorageRecoveryProvider,
  updateStorageRecovery,
} from "../../services/StorageRecovery/StorageRecovery";
import { parseCalendarDate } from "../../common/common";

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

const StorageRecovery = forwardRef(
  ({ handleNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();
    const [storageSuggestions, setStorageSuggestions] = useState<Company[]>([]);
    const [recoverySuggestions, setRecoverySuggestions] = useState<Company[]>(
      []
    );
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [typing, setTyping] = useState(false);
    const now = today(getLocalTimeZone());
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [date, setDate] = useState<DateValue | null>(now);
    const { isClosed } = useSelector((state) => state.isClosed);
    const formikRef = useRef<any>(null);
    const fetchStorageSuggestions = debounce(async (query: string) => {
      if (!query) {
        setStorageSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const response = await getStorageProvider(query);
        const rawSuggestions = response.data || response;

        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.storage_provider?.toLowerCase() ===
                item.storage_provider?.toLowerCase()
            )
        );

        setStorageSuggestions(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch company storageSuggestions:", error);
        setStorageSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    const fetchRecoverySuggestions = debounce(async (query: string) => {
      if (!query) {
        setRecoverySuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const response = await getRecoveryProvider(query);
        const rawSuggestions = response.data || response;

        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.recovery_provider?.toLowerCase() ===
                item.recovery_provider?.toLowerCase()
            )
        );

        setRecoverySuggestions(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch company recoverySuggestions:", error);
        setRecoverySuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    const storedClaimId = Number(claimID || id || 0);
    const defaultStorage = {
      storage_provider: "",
      name: "",
      claim_id: storedClaimId,
      start_date: "",
      end_date: "",
      total_storage_days: 0,
      currency: "GBP",
      charge_per_day: 25,
      total_storage_charges: 0,
      address: {
        address: "",
        postcode: "",
        mobile_tel: "",
        email: "",
      },
    };
    const defaultRecovery = {
      recovery_provider: "",
      name: "",
      claim_id: storedClaimId,
      date_of_recovery: "",
      currency: "GBP",
      recovery_charges: 0,
      address: {
        address: "",
        postcode: "",
        mobile_tel: "",
        email: "",
      },
    };
    const [initialValues, setInitialValues] = useState({
      storages: [defaultStorage],
      recoveries: [defaultRecovery],
    });

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          if (currentClaimId) {
            await fetchStorageRecovery(currentClaimId);
          }
        };
        loadData();
      }
    }, [id, claimID]);

    const fetchStorageRecovery = async (claim_id: string) => {
      try {
        setIsLoading(true);
        const response = await getStorageRecoveryProvider(claim_id);
        const storageRecovery = response.data || response;
        if (storageRecovery) {
          setIsEditing(true);
          const parsedStorages = (storageRecovery.storages || []).map((s: any) => ({
            ...s,
            claim_id: storedClaimId,
            start_date: s.start_date ? parseCalendarDate(s.start_date) : "",
            end_date: s.end_date ? parseCalendarDate(s.end_date) : "",
            total_storage_days: Number(s.total_storage_days || 0),
            charge_per_day: Number(s.charge_per_day || 25),
            total_storage_charges: Number(s.total_storage_charges || 0),
            currency: s.currency || "GBP",
          }));
          const parsedRecoveries = (storageRecovery.recoveries || []).map((r: any) => ({
            ...r,
            claim_id: storedClaimId,
            date_of_recovery: r.date_of_recovery ? parseCalendarDate(r.date_of_recovery) : "",
            recovery_charges: Number(r.recovery_charges || 0),
            currency: r.currency || "GBP",
          }));
          setInitialValues({
            storages: parsedStorages.length > 0 ? parsedStorages : [defaultStorage],
            recoveries: parsedRecoveries.length > 0 ? parsedRecoveries : [defaultRecovery],
          });
        }
      } catch (error) {
        console.error("Error fetching storage recovery:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const formatDate = (val: string | Date | null) => {
      if (!val) return null;
      const d = new Date(val);
      return d.toISOString().split("T")[0];
    };

    const handleSubmit = async (values: any) => {
      try {
        const storedClaimId = Number(claimID || id || 0);
        const payload = {
          storages: values.storages.map((s: any) => ({
            ...s,
            claim_id: storedClaimId,
            start_date: formatDate(s.start_date),
            end_date: formatDate(s.end_date),
          })),
          recoveries: values.recoveries.map((r: any) => ({
            ...r,
            claim_id: storedClaimId,
            date_of_recovery: formatDate(r.date_of_recovery),
          })),
        };

        let response;
        if (storedClaimId && isEditing) {
          response = await updateStorageRecovery(payload, storedClaimId);
        } else {
          response = await createStorageRecovery(payload);
        }

        toast.success("Storage Recovery saved successfully");

        // if (onSuccess) {
        //   onSuccess();
        // }
        if (handleNext) {
          handleNext(12, "next");
        }
      } catch (error: any) {
        toast.error("Unable to save storage recovery details");
        console.error("Error submitting form:", error);
      }
    };

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

    return (
      <div className=" sm:pt-8 pb-8 sm:pb-12 sm:pl-6 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          // validationSchema={validationSchema}
          innerRef={formikRef}
          enableReinitialize
        >
          {({ values, setFieldValue }) => {
            const [activeTab, setActiveTab] = useState(0);
            const [activeRecoveryTab, setRecoveryActiveTab] = useState(0);

            const handleSelect = (provider, type = null, index = null) => {
              const addressObj = {
                address: provider.address?.address || "",
                postcode: provider.address?.postcode || "",
                mobile_tel: provider.address?.mobile_tel || "",
                email: provider.address?.email || "",
              };

              if (type && index !== null) {
                const nameField = type === "storages" ? `storages.${index}.name` : `recoveries.${index}.name`;
                setFieldValue(nameField, provider.name || "");
                const addressPrefix =
                  type === "storages"
                    ? `storages.${index}.address`
                    : `recoveries.${index}.address`;
                Object.entries(addressObj).forEach(([subKey, subValue]) => {
                  setFieldValue(`${addressPrefix}.${subKey}`, subValue);
                });
                if (type === "storages") {
                  setFieldValue(`storages.${index}.start_date`, now);
                  setFieldValue(`storages.${index}.end_date`, "");
                  setFieldValue(`storages.${index}.total_storage_days`, 0);
                  setFieldValue(`storages.${index}.charge_per_day`, 25);
                  setFieldValue(`storages.${index}.total_storage_charges`, 0);
                }
                if (type === "recoveries") {
                  setFieldValue(`recoveries.${index}.date_of_recovery`, now);
                  setFieldValue(`recoveries.${index}.recovery_charges`, 0);
                }
              } else {
                setFieldValue(
                  "storage_provider",
                  provider.storage_provider || ""
                );
                Object.entries(addressObj).forEach(([subKey, subValue]) => {
                  setFieldValue(`address.${subKey}`, subValue);
                });
                setInitialValues((prev) => ({
                  ...prev,
                  company_name: provider.company_name || "",
                  address: addressObj,
                }));
              }
              setStorageSuggestions([]);
              setRecoverySuggestions([]);
              setTyping(false);
            };

            return (
              <>
                <FieldArray name="storages">
                  {({ push }) => (
                    <>
                      {/* Header & Add Button */}
                      <div className="border-b flex justify-between items-start border-cloudGray mb-5">
                        <div>
                          <h2 className="text-secondary text-lg font-semibold">
                            Storage Provider Details
                          </h2>
                          <p className="pb-5 text-lightGray text-sm font-normal">
                            Enter details for Storage Provider
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors self-start"
                          onClick={() => {
                            push({
                              ...defaultStorage,
                              currency: "GBP",
                            });
                            setActiveTab(values.storages.length);
                          }}
                        >
                          Add Another Storage Provider
                        </button>
                      </div>

                      {/* Tabs */}
                      <div className="flex gap-5 border-b border-cloudGray py-5 mb-5">
                        {values.storages.map((_, index) => (
                          <p
                            key={index}
                            className={`text-sm font-semibold cursor-pointer ${activeTab === index
                              ? "text-custom underline decoration-2 decoration-custom underline-offset-[24px]"
                              : "text-stormGray"
                              }`}
                            onClick={() => {
                              setActiveTab(index);
                              const recoveryCount = values.recoveries.length;
                              setRecoveryActiveTab(index < recoveryCount ? index : recoveryCount - 1);
                            }}
                          >
                            {values.storages.length === 1
                              ? "Storage Provider"
                              : `Storage Provider ${index + 1}`}
                          </p>
                        ))}
                      </div>


                      {/* Active Form */}
                      {values.storages.map((storage, index) =>
                        activeTab === index ? (
                          <form key={index} className="space-y-4 pt-5">
                            <div className="grid grid-cols-3 gap-4">
                              {/* Network Storage Provider */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.storage_provider`}
                                >
                                  Network Storage Provider
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`storages.${index}.storage_provider`}
                                >
                                  {({ field, form }: any) => {
                                    const options = storageSuggestions.map(
                                      (c: any) => ({
                                        value: c.id,
                                        label: c.storage_provider,
                                      })
                                    );

                                    return (
                                      <>
                                        <CustomSelect
                                          options={options}
                                          value={
                                            field.value
                                              ? {
                                                value: field.value,
                                                label: field.value,
                                              }
                                              : null
                                          }
                                          onInputChange={(
                                            inputValue,
                                            { action }
                                          ) => {
                                            if (action === "input-change") {
                                              fetchStorageSuggestions(
                                                inputValue
                                              );
                                              form.setFieldValue(
                                                `storages.${index}.storage_provider`,
                                                inputValue
                                              );
                                            }
                                          }}
                                          onChange={(option) => {
                                            if (option) {
                                              form.setFieldValue(
                                                `storages.${index}.storage_provider`,
                                                option.label
                                              );
                                              const selectedStorage =
                                                storageSuggestions.find(
                                                  (c: any) =>
                                                    c.id === option.value
                                                );
                                              if (selectedStorage) {
                                                handleSelect(
                                                  selectedStorage,
                                                  "storages",
                                                  index
                                                );
                                              }
                                            } else {
                                              form.setFieldValue(
                                                `storages.${index}.storage_provider`,
                                                ""
                                              );
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

                              {/* Name */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label htmlFor={`storages.${index}.name`}>
                                  Name
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`storages.${index}.name`}
                                  type="text"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                />
                                <ErrorMessage
                                  name={`storages.${index}.name`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              {/* Address */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.address.address`}
                                >
                                  Address
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <GoogleMapAutocomplete
                                  showMap={false}
                                  apiKey={config.apiGoogle}
                                  disabled={false}
                                  address={storage.address.address}
                                  onPlaceSelected={(place) => {
                                    if (place.name) {
                                      setFieldValue(
                                        `storages.${index}.address.address`,
                                        place.address
                                      );
                                      setFieldValue(
                                        `storages.${index}.address.postcode`,
                                        place?.postalCode
                                      );
                                    }
                                  }}
                                />
                                <ErrorMessage
                                  name={`storages.${index}.address.address`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              {/* Postcode */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.address.postcode`}
                                >
                                  Postcode
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`storages.${index}.address.postcode`}
                                  type="text"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                />
                                <ErrorMessage
                                  name={`storages.${index}.address.postcode`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              {/* Telephone Main */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.address.mobile_tel`}
                                >
                                  Telephone Main
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`storages.${index}.address.mobile_tel`}
                                >
                                  {({ field, form, meta }: any) => (
                                    <>
                                      <PhoneInput
                                        country="gb"
                                        value={field.value}
                                        disabled={isClosed}
                                        inputStyle={{
                                          width: "700px",
                                          height: "44px",
                                        }}
                                        onChange={(value) =>
                                          form.setFieldValue(field.name, value)
                                        }
                                      />
                                      {meta.touched && meta.error && (
                                        <div className="text-red-500 text-xs mt-1">
                                          {meta.error}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </Field>
                              </div>

                              {/* Email */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.address.email`}
                                >
                                  Email
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`storages.${index}.address.email`}
                                  type="email"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                />
                                <ErrorMessage
                                  name={`storages.${index}.address.email`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              {/* Storage Billing Details */}
                              <div className="border-y col-span-3 border-cloudGray py-5">
                                <h2 className="text-secondary text-lg font-semibold">
                                  Storage Billing Details
                                </h2>
                                <p className="text-lightGray text-sm font-normal">
                                  Enter details for Storage Billing
                                </p>
                              </div>

                              {/* Start Date */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label htmlFor={`storages.${index}.start_date`}>
                                  Start Date
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field name={`storages.${index}.start_date`}>
                                  {({ field, form }: any) => (
                                    <DatePicker
                                      maxValue={today(getLocalTimeZone())}
                                      isDisabled={isClosed}
                                      value={storage.start_date || date}
                                      onChange={(newDate) => {
                                        setDate(newDate);
                                        form.setFieldValue(`storages.${index}.start_date`, newDate);

                                        const endDate = form.values.storages[index].end_date;
                                        if (endDate && newDate) {
                                          const totalDays = differenceInCalendarDays(new Date(endDate), new Date(newDate));
                                          const safeDays = totalDays >= 0 ? totalDays : 0;

                                          form.setFieldValue(`storages.${index}.total_storage_days`, safeDays);

                                          const charge = parseFloat(form.values.storages[index].charge_per_day) || 0;
                                          form.setFieldValue(
                                            `storages.${index}.total_storage_charges`,
                                            +(charge * safeDays).toFixed(2)
                                          );
                                        }
                                      }}

                                      className="w-full"
                                    />
                                  )}
                                </Field>
                              </div>

                              {/* End Date */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label htmlFor={`storages.${index}.end_date`}>
                                  End Date
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field name={`storages.${index}.end_date`}>
                                  {({ field, form }: any) => (
                                    <DatePicker
                                      maxValue={today(getLocalTimeZone())}
                                      isDisabled={isClosed}
                                      value={storage.end_date || date}
                                      onChange={(newDate) => {
                                        setDate(newDate);
                                        form.setFieldValue(`storages.${index}.end_date`, newDate);

                                        const startDate = form.values.storages[index].start_date;

                                        if (startDate && newDate) {
                                          const totalDays = differenceInCalendarDays(new Date(newDate), new Date(startDate));
                                          const safeDays = totalDays >= 0 ? totalDays : 0;

                                          form.setFieldValue(`storages.${index}.total_storage_days`, safeDays);

                                          const charge = parseFloat(form.values.storages[index].charge_per_day) || 0;
                                          form.setFieldValue(
                                            `storages.${index}.total_storage_charges`,
                                            +(safeDays * charge).toFixed(2)
                                          );
                                        }
                                      }}

                                      className="w-full"
                                    />
                                  )}
                                </Field>

                              </div>

                              {/* Total Storage Days */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.total_storage_days`}
                                >
                                  Total Storage Days
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field name={`storages.${index}.total_storage_days`}>
                                  {({ field, form }: any) => (
                                    <input
                                      {...field}
                                      type="number"
                                      style={{ height: "44px" }}
                                      disabled={isClosed}
                                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                      onChange={(e) => {
                                        const newDays = parseInt(e.target.value) || 0;
                                        form.setFieldValue(field.name, newDays);

                                        const charge =
                                          parseFloat(form.values.storages[index].charge_per_day) || 0;
                                        form.setFieldValue(
                                          `storages.${index}.total_storage_charges`,
                                          +(charge * newDays).toFixed(2)
                                        );
                                      }}
                                    />
                                  )}
                                </Field>

                                <ErrorMessage
                                  name={`storages.${index}.total_storage_days`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              {/* Charge per Day */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.charge_per_day`}
                                >
                                  Charge Per Day
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">

                                  <Field name={`storages.${index}.charge_per_day`}>
                                    {({ field, form }: any) => (
                                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                          <span className="text-sm sm:text-base">£</span>
                                        </div>
                                        <input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          disabled={isClosed}
                                          className="flex-1 py-2 sm:py-3 text-sm sm:text-base"
                                          onChange={(e) => {
                                            const newCharge = parseFloat(e.target.value) || 0;
                                            form.setFieldValue(field.name, newCharge);

                                            const days =
                                              parseFloat(form.values.storages[index].total_storage_days) || 0;
                                            form.setFieldValue(
                                              `storages.${index}.total_storage_charges`,
                                              +(newCharge * days).toFixed(2)
                                            );
                                          }}
                                        />
                                        <div className="relative w-[110px] sm:w-[130px]">
                                          <select
                                            disabled={isClosed}
                                            className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                          >
                                            <option>GBP</option>
                                          </select>
                                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                        </div>
                                      </div>
                                    )}
                                  </Field>

                                </div>
                              </div>

                              {/* Total Storage Charges */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`storages.${index}.total_storage_charges`}
                                >
                                  Total Storage Charges
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                  <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                    <span className="text-sm sm:text-base">
                                      £
                                    </span>
                                  </div>
                                  <Field name={`storages.${index}.total_storage_charges`}>
                                    {({ field }: any) => (
                                      <input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        readOnly
                                        disabled={isClosed}
                                        className="flex-1 py-2 sm:py-3 text-sm sm:text-base"
                                      />
                                    )}
                                  </Field>

                                  <div className="relative w-[110px] sm:w-[130px]">
                                    <select
                                      disabled={isClosed}
                                      className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                    >
                                      <option>GBP</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-8 border-t border-cloudGray" />
                          </form>
                        ) : null
                      )}
                    </>
                  )}
                </FieldArray>

                {/* Recovery  */}
                <FieldArray name="recoveries">
                  {({ push }) => (
                    <>
                      <div className="border-b flex justify-between items-start pt-5 border-cloudGray">
                        <div>
                          <h2 className="text-secondary text-lg font-semibold">
                            Recovery Provider Details
                          </h2>
                          <p className="pb-5 text-lightGray text-sm font-normal">
                            Enter details for Recovery Provider
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors self-start"
                          onClick={() => {
                            push({
                              ...defaultRecovery,
                              currency: "GBP",
                            });
                            setRecoveryActiveTab(values.recoveries.length);
                          }}
                        >
                          Add Another Recovery Provider
                        </button>
                      </div>

                      {/* Tabs  */}
                      <div className="flex gap-5 border-b border-cloudGray py-5 mb-5">
                        {values.recoveries.map((_, index) => (
                          <p
                            key={index}
                            className={`text-sm font-semibold cursor-pointer ${activeRecoveryTab === index
                              ? "text-custom underline decoration-2 decoration-custom underline-offset-[24px]"
                              : "text-stormGray"
                              }`}
                            onClick={() => {
                              setRecoveryActiveTab(index);
                              setActiveTab(index); // sync storage tab on recovery tab click
                            }}
                          >
                            {values.recoveries.length === 1
                              ? "Recovery Provider"
                              : `Recovery Provider ${index + 1}`}
                          </p>
                        ))}
                      </div>


                      {/* Active Form */}
                      {values.recoveries.map((recovery, index) =>
                        activeRecoveryTab === index ? (
                          <form key={index} className="space-y-4 pt-5">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`recoveries.${index}.recovery_provider`}
                                >
                                  Recovery Storage Provider
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`recoveries.${index}.recovery_provider`}
                                >
                                  {({ field, form, meta }: any) => {
                                    const options = recoverySuggestions.map(
                                      (c: any) => ({
                                        value: c.id,
                                        label: c.recovery_provider,
                                      })
                                    );

                                    return (
                                      <>
                                        <CustomSelect
                                          options={options}
                                          value={
                                            field.value
                                              ? {
                                                value: field.value,
                                                label: field.value,
                                              }
                                              : null
                                          }
                                          onInputChange={(
                                            inputValue,
                                            { action }
                                          ) => {
                                            if (action === "input-change") {
                                              fetchRecoverySuggestions(
                                                inputValue
                                              );
                                              form.setFieldValue(
                                                `recoveries.${index}.recovery_provider`,
                                                inputValue
                                              );
                                              setTyping(true);
                                            }
                                          }}
                                          onChange={(option) => {
                                            if (option) {
                                              form.setFieldValue(
                                                `recoveries.${index}.recovery_provider`,
                                                option.label
                                              );
                                              const selectedCompany =
                                                recoverySuggestions.find(
                                                  (c: any) =>
                                                    c.id === option.value
                                                );
                                              if (selectedCompany) {
                                                handleSelect(
                                                  selectedCompany,
                                                  "recoveries",
                                                  index
                                                );
                                              }
                                            } else {
                                              form.setFieldValue(
                                                `recoveries.${index}.recovery_provider`,
                                                ""
                                              );
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
                                <Label htmlFor={`recoveries.${index}.name`}>
                                  Name
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`recoveries.${index}.name`}
                                  type="text"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                />
                                <ErrorMessage
                                  name={`recoveries.${index}.name`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`recoveries.${index}.address.address`}
                                >
                                  Address
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <GoogleMapAutocomplete
                                  showMap={false}
                                  apiKey={config.apiGoogle}
                                  disabled={false}
                                  address={recovery.address.address}
                                  onPlaceSelected={(place) => {
                                    if (place.name) {
                                      setFieldValue(
                                        `recoveries.${index}.address.address`,
                                        place.address
                                      );
                                      setFieldValue(
                                        `recoveries.${index}.address.postcode`,
                                        place?.postalCode
                                      );
                                    }
                                  }}
                                />
                                <ErrorMessage
                                  name={`recoveries.${index}.address.address`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`recoveries.${index}.address.postcode`}
                                >
                                  Postcode
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`recoveries.${index}.address.postcode`}
                                  type="text"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                />
                                <ErrorMessage
                                  name={`recoveries.${index}.address.postcode`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`recoveries.${index}.address.mobile_tel`}
                                >
                                  Telephone Main
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`recoveries.${index}.address.mobile_tel`}
                                >
                                  {({ field, form, meta }: any) => (
                                    <>
                                      <PhoneInput
                                        country="gb"
                                        value={field.value}
                                        disabled={isClosed}
                                        inputStyle={{
                                          width: "700px",
                                          height: "44px",
                                        }}
                                        onChange={(value) =>
                                          form.setFieldValue(field.name, value)
                                        }
                                      />
                                      {meta.touched && meta.error && (
                                        <div className="text-red-500 text-xs mt-1">
                                          {meta.error}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </Field>
                              </div>

                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`recoveries.${index}.address.email`}
                                >
                                  Email
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field
                                  name={`recoveries.${index}.address.email`}
                                  type="email"
                                  style={{ height: "44px" }}
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
                                <ErrorMessage
                                  name={`recoveries.${index}.address.email`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>

                              {/* Storage Billing Details  */}
                              <div className="border-y col-span-3 border-cloudGray py-5">
                                <h2 className="text-secondary text-lg font-semibold">
                                  Recovery Billing Details
                                </h2>
                                <p className="text-lightGray text-sm font-normal">
                                  Enter details for Storage Billing
                                </p>
                              </div>

                              {/* Date of Recovery */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`recoveries.${index}.date_of_recovery`}
                                >
                                  Date of Recovery
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <div className="w-full">
                                  <Field
                                    name={`recoveries.${index}.date_of_recovery`}
                                  >
                                    {({ field, form }: any) => (
                                      <DatePicker
                                        maxValue={today(getLocalTimeZone())}
                                        isDisabled={isClosed}
                                        value={
                                          recovery.date_of_recovery || date
                                        }
                                        onChange={(newDate) => {
                                          setDate(newDate);
                                          form.setFieldValue(
                                            `recoveries.${index}.date_of_recovery`,
                                            newDate
                                          );
                                        }}
                                        className="w-full"
                                      />
                                    )}
                                  </Field>
                                </div>
                              </div>

                              {/* Recovery Charges */}
                              <div className="col-span-3 lg:col-span-1">
                                <Label
                                  htmlFor={`recoveries.${index}.recovery_charges`}
                                >
                                  Recovery Charges
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                  <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                    <span className="text-sm sm:text-base">
                                      £
                                    </span>
                                  </div>
                                  <Field name={`recoveries.${index}.recovery_charges`}>
                                    {({ field, form }: any) => {
                                      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                        const inputValue = e.target.value;

                                        // Allow empty string to let the user clear the field
                                        if (inputValue === '') {
                                          form.setFieldValue(field.name, '');
                                          return;
                                        }

                                        // Regex: allow only numbers with up to 2 decimal places
                                        const validPattern = /^\d+(\.\d{0,2})?$/;

                                        if (validPattern.test(inputValue)) {
                                          form.setFieldValue(field.name, inputValue);
                                        }
                                      };

                                      return (
                                        <input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          disabled={isClosed}
                                          inputMode="decimal"
                                          className="flex-1 py-2 sm:py-3 text-sm sm:text-base"
                                          value={
                                            field.value !== undefined && field.value !== null && field.value !== ''
                                              ? parseFloat(field.value).toFixed(2)
                                              : '0.00'
                                          }
                                          onChange={handleChange}
                                        />
                                      );
                                    }}
                                  </Field>


                                  <div className="relative w-[110px] sm:w-[130px]">
                                    <select
                                      disabled={isClosed}
                                      className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer"
                                    >
                                      <option>GBP</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                  </div>
                                </div>
                                {/* {getFieldError("salvageAmount", formik)} */}
                              </div>
                              <div className="col-span-3 lg:col-span-1" />
                            </div>
                            <div className="mt-8 border-t border-cloudGray" />
                          </form>
                        ) : null
                      )}
                    </>
                  )}
                </FieldArray>
              </>
            );
          }}
        </Formik>
      </div>
    );
  }
);

StorageRecovery.displayName = "StorageRecovery";

export default StorageRecovery;