import "react-phone-input-2/lib/style.css";
import Label from "../common/label";
import { getLocalTimeZone, today } from "@internationalized/date";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import { useParams } from "react-router-dom";
import { DatePicker } from "../application/date-picker/date-picker";
import CustomSelect from "../ReactSelect/ReactSelect";
import { debounce } from "lodash";
import { useSelector } from "react-redux";
import type { DateValue } from "react-aria-components";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { createClientVehicleCategory, getClientVehicleCategory, updateClientVehicleCategory } from "../../services/HireDetail/HireDetails";
import { ChevronDown } from "lucide-react";

const validationSchema = Yup.object().shape({
  thirdPartyVehicles: Yup.array().of(
    Yup.object().shape({
      client_vehicle_category: Yup.string().required(
        "Client vehicle category is required"
      ),
      actual_vehicle_category: Yup.string().required(
        "Actual vehicle category is required"
      ),
      reference: Yup.string().required("Reference is required"),
      claim_id: Yup.number().required("Claim ID is required"),
      email_sent_date: Yup.string().nullable(),
      accepted_sent_date: Yup.string().nullable(),
      hireOutDate: Yup.string().required("Hire out date is required"),
      hireBackDate: Yup.string().required("Hire back date is required"),
      no_of_days_hired: Yup.number().required(
        "Number of days hired is required"
      ),
      total_no_of_days_hired: Yup.number().required(
        "Total number of days hired is required"
      ),
      vehicle_file_reference: Yup.string().required(
        "Vehicle file reference is required"
      ),
      registration_number: Yup.string().required(
        "Registration number is required"
      ),
      make: Yup.string().required("Make is required"),
      model: Yup.string().required("Model is required"),
      abi_insured: Yup.boolean(),
      admin_fee_type: Yup.string().required("Admin fee type is required"),
      abi_hire_charge_per_day: Yup.number().required(
        "ABI hire charge per day is required"
      ),
      extra_charge_per_day: Yup.number().required(
        "Extra charge per day is required"
      ),
      administration_fee: Yup.number().required(
        "Administration fee is required"
      ),
      bhr_hire_charge_per_day: Yup.number().required(
        "BHR hire charge per day is required"
      ),
      bhr_extra_charge_per_day: Yup.number().required(
        "BHR extra charge per day is required"
      ),
      bhr_administration_fee: Yup.number().required(
        "BHR administration fee is required"
      ),
      cwd_per_day: Yup.number().required("CDW per day is required"),
      cwd_charge: Yup.number().required("CDW charge is required"),
      collection_and_delivery_fee: Yup.number().required(
        "Collection and delivery fee is required"
      ),
      total_abi_hire_charge: Yup.number().required(
        "Total ABI hire charge is required"
      ),
      total_bhr_charge: Yup.number().required("Total BHR charge is required"),
    })
  ),
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

const HireDetails = forwardRef(
  ({ handleNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();
    const [isEditing] = useState(false);
    const [hireOutDate] = useState<DateValue | null>(today(getLocalTimeZone()));
    const [hireBackDate] = useState<DateValue | null>(
      today(getLocalTimeZone())
    );
    const { isClosed } = useSelector((state: any) => state.isClosed);
    const formikRef = useRef<any>(null);
    const [adminFeeType, setAdminFeeType] = useState([]);
    const [adminFeeTypeLoading, setAdminFeeTypeLoading] = useState(false);
    const [clientVehicleCategoryLoading, setClientVehicleCategoryLoading] = useState(false);
    const [actualVehicleCategory, setActualVehicleCategory] = useState([]);
    const [clientVehicleCategory, setClientVehicleCategory] = useState([]);
    const [actualVehicleCategoryLoading, setActualVehicleCategoryLoading] =
      useState(false);

    const fetchClientVehicleCategory = debounce(async (query: string) => {
      if (!query) {
        setClientVehicleCategory([]);
        return;
      }
      setClientVehicleCategoryLoading(true);
      try {
        const response = await getClientVehicleCategory(query);
        const rawSuggestions = response.data || response;

        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.client_vehicle_category?.toLowerCase() ===
                item.client_vehicle_category?.toLowerCase()
            )
        );

        setClientVehicleCategory(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch client vehicle category:", error);
        setClientVehicleCategory([]);
      } finally {
        setClientVehicleCategoryLoading(false);
      }
    }, 300);

    const fetchActualVehicleCategory = debounce(async (query: string) => {
      if (!query) {
        setActualVehicleCategory([]);
        return;
      }
      setActualVehicleCategoryLoading(true);
      try {
        const response = await getClientVehicleCategory(query);
        const rawSuggestions = response.data || response;

        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.client_vehicle_category?.toLowerCase() ===
                item.client_vehicle_category?.toLowerCase()
            )
        );

        setActualVehicleCategory(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch actual vehicle category:", error);
        setActualVehicleCategory([]);
      } finally {
        setActualVehicleCategoryLoading(false);
      }
    }, 300);

    const fetchAdminFeeType = debounce(async (query: string) => {
      if (!query) {
        setAdminFeeType([]);
        return;
      }
      setAdminFeeTypeLoading(true);
      try {
        const response = await getClientVehicleCategory(query);
        const rawSuggestions = response.data || response;

        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.client_vehicle_category?.toLowerCase() ===
                item.client_vehicle_category?.toLowerCase()
            )
        );

        setAdminFeeType(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch admin fee type:", error);
        setAdminFeeType([]);
      } finally {
        setAdminFeeTypeLoading(false);
      }
    }, 300);

    const [initialValues, setInitialValues] = useState({
      // Third Party Vehicles Array
      thirdPartyVehicles: [
        {
          client_vehicle_category: "",
          actual_vehicle_category: "",
          reference: "",
          claim_id: claimID || 0,
          email_sent_date: "",
          accepted_sent_date: "",
          hireOutDate: hireOutDate,
          hireBackDate: hireBackDate,
          no_of_days_hired: 0,
          total_no_of_days_hired: 0,
          vehicle_file_reference: "",
          registration_number: "",
          make: "",
          model: "",
          abi_insured: "",
          admin_fee_type: "",
          abi_hire_charge_per_day: 0,
          extra_charge_per_day: 5,
          administration_fee: 37,
          bhr_hire_charge_per_day: 0,
          bhr_extra_charge_per_day: 5,
          bhr_administration_fee: 50,
          cwd_per_day: 15,
          cwd_charge: 0,
          collection_and_delivery_fee: 60,
          total_abi_hire_charge: 0,
          total_bhr_charge: 0,
        },
      ],
    });

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          if (currentClaimId) {
            // await fetchPanelSolicitosDetails(currentClaimId);
          }
        };
        loadData();
      }
    }, [id, claimID]);

    // Calculate initial hire days for the first vehicle
    useEffect(() => {
      const hireSoFar = calculateHireSoFar(hireOutDate);
      const finalHireDays = calculateFinalHireDays(hireOutDate, hireBackDate);

      setInitialValues((prev) => ({
        ...prev,
        thirdPartyVehicles: prev.thirdPartyVehicles.map((vehicle, index) =>
          index === 0
            ? {
                ...vehicle,
                no_of_days_hired: hireSoFar,
                total_no_of_days_hired: finalHireDays,
              }
            : vehicle
        ),
      }));
    }, [hireOutDate, hireBackDate]); // Include dependencies

    // Auto-calculate Total ABI Hire Charges when relevant fields change
    // This useEffect runs once on component mount to set initial calculation
    useEffect(() => {
      const firstVehicle = initialValues.thirdPartyVehicles[0];
      const abiTotal = calculateTotalABIHireCharges(
        firstVehicle.abi_hire_charge_per_day,
        firstVehicle.extra_charge_per_day,
        firstVehicle.no_of_days_hired,
        firstVehicle.administration_fee
      );

      const cwdTotal = calculateCDWCharges(
        firstVehicle.cwd_per_day,
        firstVehicle.no_of_days_hired
      );

      const bhrTotal = calculateTotalBHRCharges(
        firstVehicle.bhr_hire_charge_per_day,
        firstVehicle.bhr_extra_charge_per_day,
        firstVehicle.no_of_days_hired,
        firstVehicle.bhr_administration_fee,
        firstVehicle.cwd_per_day,
        firstVehicle.collection_and_delivery_fee
      );

      // Only update if the calculated values are different to avoid infinite loop
      if (
        firstVehicle.total_abi_hire_charge !== abiTotal ||
        firstVehicle.cwd_charge !== cwdTotal ||
        firstVehicle.total_bhr_charge !== bhrTotal
      ) {
        setInitialValues((prev) => ({
          ...prev,
          thirdPartyVehicles: prev.thirdPartyVehicles.map((vehicle, index) =>
            index === 0
              ? {
                  ...vehicle,
                  total_abi_hire_charge: abiTotal,
                  cwd_charge: cwdTotal,
                  total_bhr_charge: bhrTotal,
                }
              : vehicle
          ),
        }));
      }
    }, [initialValues.thirdPartyVehicles]); // Include dependency to fix warning

    // Calculation functions for hire days
    const calculateHireSoFar = (hireOutDate: DateValue | null): number => {
      if (!hireOutDate) return 0;

      const today = new Date();
      const hireOut = new Date(hireOutDate.toString());

      // Set time to start of day for accurate day calculation
      today.setHours(0, 0, 0, 0);
      hireOut.setHours(0, 0, 0, 0);

      // Calculate difference in days
      const timeDiff = today.getTime() - hireOut.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days

      return Math.max(0, daysDiff); // Return 0 if negative
    };

    const calculateFinalHireDays = (
      hireOutDate: DateValue | null,
      hireBackDate: DateValue | null
    ): number => {
      if (!hireOutDate || !hireBackDate) return 0;

      const hireOut = new Date(hireOutDate.toString());
      const hireBack = new Date(hireBackDate.toString());

      // Set time to start of day for accurate day calculation
      hireOut.setHours(0, 0, 0, 0);
      hireBack.setHours(0, 0, 0, 0);

      // Calculate difference in days
      const timeDiff = hireBack.getTime() - hireOut.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days

      return Math.max(0, daysDiff); // Return 0 if negative
    };

    const calculateTotalABIHireCharges = (
      abiHireChargePerDay: number,
      extraChargePerDay: number,
      hireDays: number,
      administrationFee: number
    ): number => {
      const result =
        (abiHireChargePerDay + extraChargePerDay) * hireDays +
        administrationFee;
      console.log("ABI Calculation:", {
        abiHireChargePerDay,
        extraChargePerDay,
        hireDays,
        administrationFee,
        result,
      });
      return result;
    };

    const calculateCDWCharges = (
      cwdPerDay: number,
      hireDays: number
    ): number => {
      const result = cwdPerDay * hireDays;
      console.log("CDW Calculation:", {
        cwdPerDay,
        hireDays,
        result,
      });
      return result;
    };

    const calculateTotalBHRCharges = (
      bhrHireChargePerDay: number,
      bhrExtraChargePerDay: number,
      hireDays: number,
      bhrAdministrationFee: number,
      cwdPerDay: number,
      collectionDeliveryFee: number
    ): number => {
      const dailyCharges =
        (bhrHireChargePerDay + bhrExtraChargePerDay) * hireDays;
      const cwdCharges = cwdPerDay * hireDays;
      const result =
        dailyCharges +
        bhrAdministrationFee +
        cwdCharges +
        collectionDeliveryFee;
      console.log("BHR Calculation:", {
        bhrHireChargePerDay,
        bhrExtraChargePerDay,
        hireDays,
        bhrAdministrationFee,
        cwdPerDay,
        collectionDeliveryFee,
        dailyCharges,
        cwdCharges,
        result,
      });
      return result;
    };

    const handleSubmit = async (values: any) => {
      try {
        const storedClaimId = claimID || id;

        // Submit each vehicle separately
        for (const vehicle of values.thirdPartyVehicles) {
          const payload = {
            client_vehicle_category: vehicle.client_vehicle_category,
            actual_vehicle_category: vehicle.actual_vehicle_category,
            claim_id: storedClaimId,
            hireOutDate: vehicle.hireOutDate,
            hireBackDate: vehicle.hireBackDate,
            no_of_days_hired: vehicle.no_of_days_hired,
            total_no_of_days_hired: vehicle.total_no_of_days_hired,

            // Vehicle Details
            vehicle_file_reference: vehicle.vehicle_file_reference,
            registration_number: vehicle.registration_number,
            make: vehicle.make,
            model: vehicle.model,
            abi_insured: vehicle.abi_insured,

            // Admin Fee
            admin_fee_type: vehicle.admin_fee_type,

            // Hire Charges - ABI
            abi_hire_charge_per_day: vehicle.abi_hire_charge_per_day,
            extra_charge_per_day: vehicle.extra_charge_per_day,
            administration_fee: vehicle.administration_fee,

            // Hire Charges - BHR
            bhr_hire_charge_per_day: vehicle.bhr_hire_charge_per_day,
            bhr_extra_charge_per_day: vehicle.bhr_extra_charge_per_day,
            bhr_administration_fee: vehicle.bhr_administration_fee,

            // Collection and Delivery
            cwd_per_day: vehicle.cwd_per_day,
            cwd_charge: vehicle.cwd_charge,
            collection_and_delivery_fee: vehicle.collection_and_delivery_fee,

            // Total
            total_abi_hire_charge: vehicle.total_abi_hire_charge,
            total_bhr_charge: vehicle.total_bhr_charge,
          };

          if (storedClaimId && isEditing) {
            await updateClientVehicleCategory(payload, storedClaimId);
          } else {
            await createClientVehicleCategory(payload);
          }
        }

        toast.success("Hire Details saved successfully");

        if (handleNext) {
          handleNext(11, "next");
        }
      } catch (error: any) {
        toast.error("Unable to save hire details");
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
          validationSchema={validationSchema}
          innerRef={formikRef}
          enableReinitialize
        >
          {({ values, setFieldValue }: any) => {
            const handleSelect = (company: any, vehicleIndex: number = 0) => {
              const newValues = {
                client_vehicle_category: company.client_vehicle_category || "",
                actual_vehicle_category: company.actual_vehicle_category || "",
              };

              // Update Formik live values for specific vehicle
              setFieldValue(
                `thirdPartyVehicles.${vehicleIndex}.client_vehicle_category`,
                newValues.client_vehicle_category
              );
              setFieldValue(
                `thirdPartyVehicles.${vehicleIndex}.actual_vehicle_category`,
                newValues.actual_vehicle_category
              );

              setClientVehicleCategory([]);
            };

            return (
              <>
                <FieldArray name="thirdPartyVehicles">
                  {({ remove, push }) => (
                    <div>
                      {values.thirdPartyVehicles.map(
                        (_v: any, index: number) => (
                          <div key={index} className="my-2 rounded">
                            <div className="flex justify-between items-center my-5">
                              <div>
                                <h2 className="text-xl font-bold">
                                  Hire Details {values.thirdPartyVehicles.length > 1 ? `${index + 1} ` : ""}
                                </h2>
                                <p className="pb-5 text-lightGray text-sm font-normal">
                                  Enter details for Hire Details                          
                                </p>
                              </div>
                              <div>
                                {index === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (values.thirdPartyVehicles.length < 2) {
                                        push({
                                          client_vehicle_category: "",
                                          actual_vehicle_category: "",
                                          reference: "",
                                          claim_id: claimID || 0,
                                          email_sent_date: "",
                                          accepted_sent_date: "",
                                          hireOutDate: hireOutDate,
                                          hireBackDate: hireBackDate,
                                          no_of_days_hired: 0,
                                          total_no_of_days_hired: 0,
                                          vehicle_file_reference: "",
                                          registration_number: "",
                                          make: "",
                                          model: "",
                                          abi_insured: "",
                                          admin_fee_type: "",
                                          abi_hire_charge_per_day: 0,
                                          extra_charge_per_day: 5,
                                          administration_fee: 37,
                                          bhr_hire_charge_per_day: 0,
                                          bhr_extra_charge_per_day: 5,
                                          bhr_administration_fee: 50,
                                          cwd_per_day: 15,
                                          cwd_charge: 0,
                                          collection_and_delivery_fee: 0,
                                          total_abi_hire_charge: 0,
                                          total_bhr_charge: 0,
                                        });
                                      }
                                    }}
                                    disabled={
                                      values.thirdPartyVehicles.length >= 2
                                    }
                                    className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Add Another Vehicle
                                  </button>
                                )}
                              </div>
                              {index === 1 && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                >
                                  <span>Remove Vehicle</span>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                              
                            <div className="flex justify-between border-b border-cloudGray mb-5">
                              <div>
                                 <h2 className="text-secondary text-lg font-semibold">
                                   Vehicle Category {values.thirdPartyVehicles.length > 1 ? `${index + 1} ` : ""}
                                 </h2>
                                <p className="pb-5 text-lightGray text-sm font-normal">
                                  Enter details for Vehicle Category
                                </p>
                              </div>
                              





                            </div>
                            <form className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                {/* Client Vehicle Category */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.client_vehicle_category`}
                                  >
                                    Client Vehicle Category
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.client_vehicle_category`}
                                  >
                                    {({ form }: any) => {
                                      const options = clientVehicleCategory.map(
                                        (c: any) => ({
                                          value: c.id,
                                          label: c.client_vehicle_category,
                                        })
                                      );

                                      return (
                                        <>
                                          <CustomSelect
                                            key={`client_vehicle_category_${index}`}
                                            options={options}
                                            value={
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.client_vehicle_category
                                                ? {
                                                    value:
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ].client_vehicle_category,
                                                    label:
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ].client_vehicle_category,
                                                  }
                                                : null
                                            }
                                            onInputChange={(
                                              inputValue: any
                                            ) => {
                                              if (inputValue) {
                                                fetchClientVehicleCategory(
                                                  inputValue
                                                );
                                              }
                                            }}
                                            onChange={(option) => {
                                              if (option) {
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.client_vehicle_category`,
                                                  option.label
                                                );
                                                const selectedCompany =
                                                  clientVehicleCategory.find(
                                                    (c: any) =>
                                                      c.id === option.value
                                                  );
                                                if (selectedCompany) {
                                                  handleSelect(
                                                    selectedCompany,
                                                    index
                                                  );
                                                }
                                              } else {
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.client_vehicle_category`,
                                                  ""
                                                );
                                              }
                                            }}
                                            placeholder="Type client vehicle category"
                                            disabled={isClosed}
                                          />
                                          {clientVehicleCategoryLoading && (
                                            <div className="absolute right-3 top-2 text-gray-400 text-sm">
                                              Loading...
                                            </div>
                                          )}
                                        </>
                                      );
                                    }}
                                  </Field>
                                </div>

                                {/* Actual Vehicle Category */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.actual_vehicle_category`}
                                  >
                                    Actual Vehicle Category
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.actual_vehicle_category`}
                                  >
                                    {({ form }: any) => {
                                      const options = actualVehicleCategory.map(
                                        (c: any) => ({
                                          value: c.id,
                                          label: c.client_vehicle_category,
                                        })
                                      );

                                      return (
                                        <>
                                          <CustomSelect
                                            key={`actual_vehicle_category_${index}`}
                                            options={options}
                                            value={
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.actual_vehicle_category
                                                ? {
                                                    value:
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ].actual_vehicle_category,
                                                    label:
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ].actual_vehicle_category,
                                                  }
                                                : null
                                            }
                                            onInputChange={(
                                              inputValue: any
                                            ) => {
                                              if (inputValue) {
                                                fetchActualVehicleCategory(
                                                  inputValue
                                                );
                                              }
                                            }}
                                            onChange={(option) => {
                                              if (option) {
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.actual_vehicle_category`,
                                                  option.label
                                                );
                                                const selectedCompany =
                                                  actualVehicleCategory.find(
                                                    (c: any) =>
                                                      c.id === option.value
                                                  );
                                                if (selectedCompany) {
                                                  handleSelect(
                                                    selectedCompany,
                                                    index
                                                  );
                                                }
                                              } else {
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.actual_vehicle_category`,
                                                  ""
                                                );
                                              }
                                            }}
                                            placeholder="Type actual vehicle category"
                                            disabled={isClosed}
                                          />
                                          {actualVehicleCategoryLoading && (
                                            <div className="absolute right-3 top-2 text-gray-400 text-sm">
                                              Loading...
                                            </div>
                                          )}
                                        </>
                                      );
                                    }}
                                  </Field>
                                </div>

                                <div className="col-span-3 lg:col-span-1" />
                              </div>
                              <div className="mt-8 border-t border-cloudGray" />
                            </form>
                            {/* Hire Period */}
                            <div className="border-b border-cloudGray my-5">
                               <h2 className="text-secondary text-lg font-semibold">
                                 Hire Period {values.thirdPartyVehicles.length > 1 ? `${index + 1} ` : ""}
                               </h2>
                              <p className="pb-5 text-lightGray text-sm font-normal">
                                Enter details for Hire Period
                              </p>
                            </div>
                            <form className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.hireOutDate`}
                                  >
                                    Hire Out Date
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="w-full">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.hireOutDate`}
                                    >
                                      {({ form }: any) => (
                                        <DatePicker
                                          maxValue={today(getLocalTimeZone())}
                                          isDisabled={isClosed}
                                          value={
                                            form.values.thirdPartyVehicles[
                                              index
                                            ]?.hireOutDate || hireOutDate
                                          }
                                          onChange={(newDate) => {
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.hireOutDate`,
                                              newDate
                                            );
                                            // Auto-calculate hire days
                                            const hireSoFar =
                                              calculateHireSoFar(newDate);
                                            const currentHireBackDate =
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.hireBackDate || hireBackDate;
                                            const finalHireDays =
                                              calculateFinalHireDays(
                                                newDate,
                                                currentHireBackDate
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.no_of_days_hired`,
                                              hireSoFar
                                            );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_no_of_days_hired`,
                                              finalHireDays
                                            );

                                            // Trigger ABI total calculation
                                            const abiTotal =
                                              calculateTotalABIHireCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.abi_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.extra_charge_per_day
                                                ) || 0,
                                                hireSoFar,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.administration_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                              abiTotal
                                            );

                                            // Trigger CDW total calculation
                                            const cwdTotal =
                                              calculateCDWCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.cwd_per_day
                                                ) || 0,
                                                hireSoFar
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.cwd_charge`,
                                              cwdTotal
                                            );

                                            // Trigger BHR total calculation
                                            const bhrTotal =
                                              calculateTotalBHRCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_extra_charge_per_day
                                                ) || 0,
                                                hireSoFar,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_administration_fee
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.cwd_per_day
                                                ) || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.collection_and_delivery_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_bhr_charge`,
                                              bhrTotal
                                            );
                                          }}
                                          className="w-full"
                                        />
                                      )}
                                    </Field>
                                  </div>
                                </div>

                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.hireBackDate`}
                                  >
                                    Hire Back Date
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="w-full">
                                    <Field
                                      name={`thirdPartyVehicles.${index}.hireBackDate`}
                                    >
                                      {({ form }: any) => (
                                        <DatePicker
                                          maxValue={today(getLocalTimeZone())}
                                          isDisabled={isClosed}
                                          value={
                                            form.values.thirdPartyVehicles[
                                              index
                                            ]?.hireBackDate || hireBackDate
                                          }
                                          onChange={(newDate) => {
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.hireBackDate`,
                                              newDate
                                            );
                                            // Auto-calculate final hire days
                                            const currentHireOutDate =
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.hireOutDate || hireOutDate;
                                            const finalHireDays =
                                              calculateFinalHireDays(
                                                currentHireOutDate,
                                                newDate
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_no_of_days_hired`,
                                              finalHireDays
                                            );

                                            // Trigger ABI total calculation using hire so far (current days hired)
                                            const hireSoFar =
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.no_of_days_hired || 0;
                                            const abiTotal =
                                              calculateTotalABIHireCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.abi_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.extra_charge_per_day
                                                ) || 0,
                                                hireSoFar,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.administration_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                              abiTotal
                                            );

                                            // Trigger CDW total calculation
                                            const cwdTotal =
                                              calculateCDWCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.cwd_per_day
                                                ) || 0,
                                                hireSoFar
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.cwd_charge`,
                                              cwdTotal
                                            );

                                            // Trigger BHR total calculation
                                            const bhrTotal =
                                              calculateTotalBHRCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_extra_charge_per_day
                                                ) || 0,
                                                hireSoFar,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_administration_fee
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.cwd_per_day
                                                ) || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.collection_and_delivery_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_bhr_charge`,
                                              bhrTotal
                                            );
                                          }}
                                          className="w-full"
                                        />
                                      )}
                                    </Field>
                                  </div>
                                </div>
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.no_of_days_hired`}
                                  >
                                    Hire So Far
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.no_of_days_hired`}
                                  >
                                    {({ form }: any) => (
                                      <input
                                        type="text"
                                        value={
                                          form.values.thirdPartyVehicles[index]
                                            ?.no_of_days_hired || 0
                                        }
                                        readOnly
                                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-sm sm:text-base cursor-not-allowed"
                                        style={{ height: "44px" }}
                                      />
                                    )}
                                  </Field>
                                  <ErrorMessage
                                    name={`thirdPartyVehicles.${index}.no_of_days_hired`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.total_no_of_days_hired`}
                                  >
                                    Final Hire Days
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.total_no_of_days_hired`}
                                  >
                                    {({ form }: any) => (
                                      <input
                                        type="text"
                                        value={
                                          form.values.thirdPartyVehicles[index]
                                            ?.total_no_of_days_hired || 0
                                        }
                                        readOnly
                                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-sm sm:text-base cursor-not-allowed"
                                        style={{ height: "44px" }}
                                      />
                                    )}
                                  </Field>
                                  <ErrorMessage
                                    name={`thirdPartyVehicles.${index}.total_no_of_days_hired`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1" />
                              </div>
                              <div className="mt-8 border-t border-cloudGray" />
                            </form>
                            {/* Hire Vehicle Provided  */}

                            <div className="border-b border-cloudGray my-5">
                               <h2 className="text-secondary text-lg font-semibold">
                                 Hire Vehicle Provided {values.thirdPartyVehicles.length > 1 ? `${index + 1} ` : ""}
                               </h2>
                              <p className="pb-5 text-lightGray text-sm font-normal">
                                Enter details for Hire Vehicle Provided{" "}
                              </p>
                            </div>
                            <form className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                {/* vehicle file reference */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.vehicle_file_reference`}
                                  >
                                    Vehicle File Reference
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.vehicle_file_reference`}
                                    type="text"
                                    style={{ height: "44px" }}
                                    disabled={isClosed}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name={`thirdPartyVehicles.${index}.vehicle_file_reference`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.registration_number`}
                                  >
                                    Registration Number
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.registration_number`}
                                    type="text"
                                    style={{ height: "44px" }}
                                    disabled={isClosed}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name={`thirdPartyVehicles.${index}.registration_number`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.make`}
                                  >
                                    Make
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.make`}
                                    type="text"
                                    style={{ height: "44px" }}
                                    disabled={isClosed}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name={`thirdPartyVehicles.${index}.make`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.model`}
                                  >
                                    Model
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.model`}
                                    type="text"
                                    style={{ height: "44px" }}
                                    disabled={isClosed}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name={`thirdPartyVehicles.${index}.model`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1" />
                              </div>
                              <div className="mt-8 border-t border-cloudGray" />
                            </form>

                            {/* ABI hire  */}
                            <div className="border-b border-cloudGray my-5">
                               <h2 className="text-secondary text-lg font-semibold">
                                 ABI Hire Charges & Administration Fee Details {values.thirdPartyVehicles.length > 1 ? `${index + 1} ` : ""}
                               </h2>
                              <p className="pb-5 text-lightGray text-sm font-normal">
                                Enter details for ABI Hire Charges &
                                Administration Fee Details
                              </p>
                            </div>
                            <form className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.abi_insured`}
                                  >
                                    ABI Insurer
                                  </Label>
                                </div>
                                <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                                  <label className="flex items-center">
                                    <Field
                                      type="checkbox"
                                      name={`thirdPartyVehicles.${index}.abi_insured`}
                                      disabled={isClosed}
                                      className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-purple-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                      Yes
                                    </span>
                                  </label>
                                </div>

                                {/* ABI Hire Charge Per Day */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.abi_hire_charge_per_day`}
                                  >
                                    ABI Hire Charge Per Day
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.abi_hire_charge_per_day`}
                                    >
                                      {({ field, form }: any) => {
                                        const handleChange = (
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          const inputValue = e.target.value;

                                          // Allow empty string to let the user clear the field
                                          if (inputValue === "") {
                                            form.setFieldValue(field.name, "");
                                            return;
                                          }

                                          // Regex: allow only numbers with up to 2 decimal places
                                          const validPattern =
                                            /^\d+(\.\d{0,2})?$/;

                                          if (validPattern.test(inputValue)) {
                                            form.setFieldValue(
                                              field.name,
                                              inputValue
                                            );

                                            // Trigger ABI total calculation
                                            const abiTotal =
                                              calculateTotalABIHireCharges(
                                                parseFloat(inputValue) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.extra_charge_per_day
                                                ) || 0,
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.no_of_days_hired || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.administration_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            console.log(
                                              "Setting total_abi_hire_charge to:",
                                              abiTotal
                                            );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                              abiTotal
                                            );
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
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
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

                                {/* Extra Charge Per Day */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.extra_charge_per_day`}
                                  >
                                    Extra Charge Per Day
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.extra_charge_per_day`}
                                    >
                                      {({ field, form }: any) => {
                                        const handleChange = (
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          const inputValue = e.target.value;

                                          // Allow empty string to let the user clear the field
                                          if (inputValue === "") {
                                            form.setFieldValue(field.name, "");
                                            return;
                                          }

                                          // Regex: allow only numbers with up to 2 decimal places
                                          const validPattern =
                                            /^\d+(\.\d{0,2})?$/;

                                          if (validPattern.test(inputValue)) {
                                            form.setFieldValue(
                                              field.name,
                                              inputValue
                                            );

                                            // Trigger ABI total calculation
                                            const abiTotal =
                                              calculateTotalABIHireCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.abi_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(inputValue) || 0,
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.no_of_days_hired || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.administration_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                              abiTotal
                                            );
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
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
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

                                {/* Admin Fee Type */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.admin_fee_type`}
                                  >
                                    Admin Fee Type
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`thirdPartyVehicles.${index}.admin_fee_type`}
                                  >
                                    {({ form }: any) => {
                                      const options = adminFeeType.map(
                                        (c: any) => ({
                                          value: c.id,
                                          label: c.admin_fee_type,
                                        })
                                      );

                                      return (
                                        <>
                                          <CustomSelect
                                            options={options}
                                            value={
                                              form.values.thirdPartyVehicles[
                                                index
                                              ]?.admin_fee_type
                                                ? {
                                                    value:
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ].admin_fee_type,
                                                    label:
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ].admin_fee_type,
                                                  }
                                                : null
                                            }
                                            onInputChange={(
                                              inputValue: any
                                            ) => {
                                              if (inputValue) {
                                                fetchAdminFeeType(inputValue);
                                              }
                                            }}
                                            onChange={(option) => {
                                              if (option) {
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.admin_fee_type`,
                                                  option.label
                                                );
                                                const selectedCompany =
                                                  adminFeeType.find(
                                                    (c: any) =>
                                                      c.id === option.value
                                                  );
                                                if (selectedCompany) {
                                                  handleSelect(
                                                    selectedCompany,
                                                    index
                                                  );
                                                }
                                              } else {
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.admin_fee_type`,
                                                  ""
                                                );
                                              }
                                            }}
                                            placeholder="Type admin fee type"
                                            disabled={isClosed}
                                          />
                                          {adminFeeTypeLoading && (
                                            <div className="absolute right-3 top-2 text-gray-400 text-sm">
                                              Loading...
                                            </div>
                                          )}
                                        </>
                                      );
                                    }}
                                  </Field>
                                </div>

                                {/* Administration Fee - Only show for first vehicle (index 0) */}
                                {index === 0 && (
                                  <>
                                    <div className="col-span-3 lg:col-span-1">
                                      <Label
                                        htmlFor={`thirdPartyVehicles.${index}.administration_fee`}
                                      >
                                        Administration Fee
                                      </Label>
                                    </div>
                                    <div className="col-span-3 lg:col-span-2">
                                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                          <span className="text-sm sm:text-base">
                                            £
                                          </span>
                                        </div>
                                        <Field
                                          name={`thirdPartyVehicles.${index}.administration_fee`}
                                        >
                                          {({ field, form }: any) => {
                                            const handleChange = (
                                              e: React.ChangeEvent<HTMLInputElement>
                                            ) => {
                                              const inputValue = e.target.value;

                                              // Allow empty string to let the user clear the field
                                              if (inputValue === "") {
                                                form.setFieldValue(
                                                  field.name,
                                                  ""
                                                );
                                                return;
                                              }

                                              // Regex: allow only numbers with up to 2 decimal places
                                              const validPattern =
                                                /^\d+(\.\d{0,2})?$/;

                                              if (
                                                validPattern.test(inputValue)
                                              ) {
                                                form.setFieldValue(
                                                  field.name,
                                                  inputValue
                                                );

                                                // Trigger ABI total calculation
                                                const abiTotal =
                                                  calculateTotalABIHireCharges(
                                                    parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.abi_hire_charge_per_day
                                                    ) || 0,
                                                    parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.extra_charge_per_day
                                                    ) || 0,
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.no_of_days_hired || 0,
                                                    parseFloat(inputValue) || 0
                                                  );
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.total_abi_hire_charge`,
                                                  abiTotal
                                                );
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
                                                  field.value !== undefined &&
                                                  field.value !== null &&
                                                  field.value !== ""
                                                    ? parseFloat(
                                                        field.value
                                                      ).toFixed(2)
                                                    : "0.00"
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
                                  </>
                                )}

                                {/*Total ABI Hire Charge */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.total_abi_hire_charge`}
                                  >
                                    Total ABI Hire Charge
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-gray-100 h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg ">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.total_abi_hire_charge`}
                                    >
                                      {({ field }: any) => (
                                        <input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          disabled={true}
                                          readOnly={true}
                                          className="flex-1 py-2 sm:py-3 text-sm sm:text-base bg-gray-100"
                                          value={
                                            field.value !== undefined &&
                                            field.value !== null &&
                                            field.value !== ""
                                              ? parseFloat(field.value).toFixed(
                                                  2
                                                )
                                              : "0.00"
                                          }
                                        />
                                      )}
                                    </Field>

                                    <div className="relative w-[110px] sm:w-[130px] ">
                                      <select
                                        disabled={isClosed}
                                        className="w-full h-full px-2 sm:px-3 rounded-lg bg-gray-100 appearance-none cursor-pointer"
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

                            {/* ABI hire  */}
                            <div className="border-b border-cloudGray my-5">
                               <h2 className="text-secondary text-lg font-semibold">
                                 Total BHR Hire Charges & Administration Fee
                                 Details {values.thirdPartyVehicles.length > 1 ? `${index + 1} ` : ""}
                               </h2>
                              <p className="pb-5 text-lightGray text-sm font-normal">
                                Enter details for BHR Hire Charges &
                                Administration Fee Details
                              </p>
                            </div>
                            <form className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                {/* BHR Hire Charge Per Day */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.bhr_hire_charge_per_day`}
                                  >
                                    BHR Hire Charge Per Day
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border  border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                      <span className="text-sm sm:text-base ">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.bhr_hire_charge_per_day`}
                                    >
                                      {({ field, form }: any) => {
                                        const handleChange = (
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          const inputValue = e.target.value;

                                          // Allow empty string to let the user clear the field
                                          if (inputValue === "") {
                                            form.setFieldValue(field.name, "");
                                            return;
                                          }

                                          // Regex: allow only numbers with up to 2 decimal places
                                          const validPattern =
                                            /^\d+(\.\d{0,2})?$/;

                                          if (validPattern.test(inputValue)) {
                                            form.setFieldValue(
                                              field.name,
                                              inputValue
                                            );

                                            // Trigger BHR total calculation
                                            const bhrTotal =
                                              calculateTotalBHRCharges(
                                                parseFloat(inputValue) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_extra_charge_per_day
                                                ) || 0,
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.no_of_days_hired || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_administration_fee
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.cwd_per_day
                                                ) || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.collection_and_delivery_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_bhr_charge`,
                                              bhrTotal
                                            );
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
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
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

                                {/* BHR Extra Charge Per Day */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.bhr_extra_charge_per_day`}
                                  >
                                    BHR Extra Charge Per Day
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.bhr_extra_charge_per_day`}
                                    >
                                      {({ field, form }: any) => {
                                        const handleChange = (
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          const inputValue = e.target.value;

                                          // Allow empty string to let the user clear the field
                                          if (inputValue === "") {
                                            form.setFieldValue(field.name, "");
                                            return;
                                          }

                                          // Regex: allow only numbers with up to 2 decimal places
                                          const validPattern =
                                            /^\d+(\.\d{0,2})?$/;

                                          if (validPattern.test(inputValue)) {
                                            form.setFieldValue(
                                              field.name,
                                              inputValue
                                            );

                                            // Trigger BHR total calculation
                                            const bhrTotal =
                                              calculateTotalBHRCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(inputValue) || 0,
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.no_of_days_hired || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_administration_fee
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.cwd_per_day
                                                ) || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.collection_and_delivery_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_bhr_charge`,
                                              bhrTotal
                                            );
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
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
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

                                {/* BHR Administration Fee */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.bhr_administration_fee`}
                                  >
                                    BHR Administration Fee
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.bhr_administration_fee`}
                                    >
                                      {({ field, form }: any) => {
                                        const handleChange = (
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          const inputValue = e.target.value;

                                          // Allow empty string to let the user clear the field
                                          if (inputValue === "") {
                                            form.setFieldValue(field.name, "");
                                            return;
                                          }

                                          // Regex: allow only numbers with up to 2 decimal places
                                          const validPattern =
                                            /^\d+(\.\d{0,2})?$/;

                                          if (validPattern.test(inputValue)) {
                                            form.setFieldValue(
                                              field.name,
                                              inputValue
                                            );

                                            // Trigger BHR total calculation
                                            const bhrTotal =
                                              calculateTotalBHRCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_extra_charge_per_day
                                                ) || 0,
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.no_of_days_hired || 0,
                                                parseFloat(inputValue) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.cwd_per_day
                                                ) || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.collection_and_delivery_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_bhr_charge`,
                                              bhrTotal
                                            );
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
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "0.00"
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

                                {/*CDW Per Day */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.cwd_per_day`}
                                  >
                                    CDW Per Day
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.cwd_per_day`}
                                    >
                                      {({ field, form }: any) => {
                                        const handleChange = (
                                          e: React.ChangeEvent<HTMLInputElement>
                                        ) => {
                                          const inputValue = e.target.value;

                                          // Allow empty string to let the user clear the field
                                          if (inputValue === "") {
                                            form.setFieldValue(field.name, "");
                                            return;
                                          }

                                          // Regex: allow only numbers with up to 2 decimal places
                                          const validPattern =
                                            /^\d+(\.\d{0,2})?$/;

                                          if (validPattern.test(inputValue)) {
                                            form.setFieldValue(
                                              field.name,
                                              inputValue
                                            );

                                            // Trigger CDW total calculation
                                            const cwdTotal =
                                              calculateCDWCharges(
                                                parseFloat(inputValue) || 0,
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.no_of_days_hired || 0
                                              );
                                            console.log(
                                              "Setting cwd_charge to:",
                                              cwdTotal
                                            );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.cwd_charge`,
                                              cwdTotal
                                            );

                                            // Also trigger BHR total calculation since CDW is part of BHR formula
                                            const bhrTotal =
                                              calculateTotalBHRCharges(
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_hire_charge_per_day
                                                ) || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_extra_charge_per_day
                                                ) || 0,
                                                form.values.thirdPartyVehicles[
                                                  index
                                                ]?.no_of_days_hired || 0,
                                                parseFloat(
                                                  form.values
                                                    .thirdPartyVehicles[index]
                                                    ?.bhr_administration_fee
                                                ) || 0,
                                                parseFloat(inputValue) || 0,
                                                index === 0
                                                  ? parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.collection_and_delivery_fee
                                                    ) || 0
                                                  : 0
                                              );
                                            form.setFieldValue(
                                              `thirdPartyVehicles.${index}.total_bhr_charge`,
                                              bhrTotal
                                            );
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
                                              field.value !== undefined &&
                                              field.value !== null &&
                                              field.value !== ""
                                                ? parseFloat(
                                                    field.value
                                                  ).toFixed(2)
                                                : "15.00"
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
                                    </div>
                                  </div>
                                </div>
                                {/* <div className="col-span-3 lg:col-span-3"> */}
                                  {/* {getFieldError("salvageAmount", formik)} */}
                                {/* </div> */}

                                {/*CWD Charge */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.cwd_charge`}
                                  >
                                    CDW Charges
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-gray-100 h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg bg-gray-100">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.cwd_charge`}
                                    >
                                      {({ field }: any) => (
                                        <input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          disabled={true}
                                          readOnly={true}
                                          className="flex-1 py-2 sm:py-3 text-sm sm:text-base bg-gray-100"
                                          value={
                                            field.value !== undefined &&
                                            field.value !== null &&
                                            field.value !== ""
                                              ? parseFloat(field.value).toFixed(
                                                  2
                                                )
                                              : "0.00"
                                          }
                                        />
                                      )}
                                    </Field>

                                    <div className="relative w-[110px] sm:w-[130px]">
                                      <select
                                        disabled={isClosed}
                                        className="w-full h-full px-2 sm:px-3 rounded-lg bg-gray-100 appearance-none cursor-pointer"
                                      >
                                        <option>GBP</option>
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                    </div>
                                  </div>
                                  {/* {getFieldError("salvageAmount", formik)} */}
                                </div>

                                {/*Collection and Delivery fee - Only show for first vehicle (index 0) */}
                                {index === 0 && (
                                  <>
                                    <div className="col-span-3 lg:col-span-1">
                                      <Label
                                        htmlFor={`thirdPartyVehicles.${index}.collection_and_delivery_fee`}
                                      >
                                        Collection and Delivery fee
                                      </Label>
                                    </div>
                                    <div className="col-span-3 lg:col-span-2">
                                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                          <span className="text-sm sm:text-base">
                                            £
                                          </span>
                                        </div>
                                        <Field
                                          name={`thirdPartyVehicles.${index}.collection_and_delivery_fee`}
                                        >
                                          {({ field, form }: any) => {
                                            const handleChange = (
                                              e: React.ChangeEvent<HTMLInputElement>
                                            ) => {
                                              const inputValue = e.target.value;

                                              // Allow empty string to let the user clear the field
                                              if (inputValue === "") {
                                                form.setFieldValue(
                                                  field.name,
                                                  ""
                                                );
                                                return;
                                              }

                                              // Regex: allow only numbers with up to 2 decimal places
                                              const validPattern =
                                                /^\d+(\.\d{0,2})?$/;

                                              if (
                                                validPattern.test(inputValue)
                                              ) {
                                                form.setFieldValue(
                                                  field.name,
                                                  inputValue
                                                );

                                                // Trigger BHR total calculation
                                                const bhrTotal =
                                                  calculateTotalBHRCharges(
                                                    parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.bhr_hire_charge_per_day
                                                    ) || 0,
                                                    parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]
                                                        ?.bhr_extra_charge_per_day
                                                    ) || 0,
                                                    form.values
                                                      .thirdPartyVehicles[index]
                                                      ?.no_of_days_hired || 0,
                                                    parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.bhr_administration_fee
                                                    ) || 0,
                                                    parseFloat(
                                                      form.values
                                                        .thirdPartyVehicles[
                                                        index
                                                      ]?.cwd_per_day
                                                    ) || 0,
                                                    parseFloat(inputValue) || 0
                                                  );
                                                form.setFieldValue(
                                                  `thirdPartyVehicles.${index}.total_bhr_charge`,
                                                  bhrTotal
                                                );
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
                                                  field.value !== undefined &&
                                                  field.value !== null &&
                                                  field.value !== ""
                                                    ? parseFloat(
                                                        field.value
                                                      ).toFixed(2)
                                                    : "0.00"
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
                                  </>
                                )}

                                {/*Total BHR Charge */}
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`thirdPartyVehicles.${index}.total_bhr_charge`}
                                  >
                                    Total BHR Charges
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-gray-100 h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg bg-gray-100">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`thirdPartyVehicles.${index}.total_bhr_charge`}
                                    >
                                      {({ field }: any) => (
                                        <input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          disabled={true}
                                          readOnly={true}
                                          className="flex-1 py-2 sm:py-3 text-sm sm:text-base bg-gray-100"
                                          value={
                                            field.value !== undefined &&
                                            field.value !== null &&
                                            field.value !== ""
                                              ? parseFloat(field.value).toFixed(
                                                  2
                                                )
                                              : "0.00"
                                          }
                                        />
                                      )}
                                    </Field>

                                    <div className="relative w-[110px] sm:w-[130px]">
                                      <select
                                        disabled={isClosed}
                                        className="w-full h-full px-2 sm:px-3 rounded-lg bg-gray-100 appearance-none cursor-pointer"
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
                          </div>
                        )
                      )}
                    </div>
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

HireDetails.displayName = "HireDetails";

export default HireDetails;
