import Label from "../common/label";
import { getLocalTimeZone, today } from "@internationalized/date";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback} from "react";
import { Field, Formik } from "formik";
import { useParams } from "react-router-dom";
import { DatePicker } from "../application/date-picker/date-picker";
import { useSelector } from "react-redux";
import { createDriverDocumentAgreement, getDriverDocumentAgreement, updateDriverDocumentAgreement } from "../../services/DriverDocumentAgreement/DriverDocumentAgreement";
import { toast } from "react-toastify";
import { parseCalendarDate } from "../../common/common";
import type { DateValue } from "react-aria-components";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  // Driver Proofs Check List Section
  driver_licence_received_on: Yup.mixed(),
  driver_licence_checks_completed_on: Yup.mixed(),
  proof_of_address_1_received_on: Yup.mixed(),
  proof_of_address_2_received_on: Yup.mixed(),
  bank_statement_received_on_pre_hire: Yup.mixed(),
  bank_statement_received_on_post_hire: Yup.mixed(),
  taxi_badge_received_on: Yup.mixed(),
  v5_received_on: Yup.mixed(),
  mot_certificate_received_on: Yup.mixed(),
  insurance_certificate_received_on: Yup.mixed(),
  suspension_notice_received_on: Yup.mixed(),
  suspension_uplift_received_on: Yup.mixed(),
  
  // Agreements & Statements Check List Section
  signed_cha_received_on: Yup.mixed(),
  signed_mitigation_received_on: Yup.mixed(),
  arf_received_on: Yup.mixed(),
  signed_cil_agreement_received_on: Yup.mixed(),
  
  claim_id: Yup.number().required("Claim ID is required"),
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
  // Driver Proofs Check List Section
  driver_licence_received_on: string;
  driver_licence_checks_completed_on: string;
  proof_of_address_1_received_on: string;
  proof_of_address_2_received_on: string;
  bank_statement_received_on_pre_hire: string;
  bank_statement_received_on_post_hire: string;
  taxi_badge_received_on: string;
  v5_received_on: string;
  mot_certificate_received_on: string;
  insurance_certificate_received_on: string;
  suspension_notice_received_on: string;
  suspension_uplift_received_on: string;
  
  // Agreements & Statements Check List Section
  signed_cha_received_on: string;
  signed_mitigation_received_on: string;
  arf_received_on: string;
  signed_cil_agreement_received_on: string;
  
  claim_id: number;
}

const DriverDocumentAgreement = forwardRef(
  ({ handleNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');
    const {id} = useParams()
    const [isEditing, setIsEditing] = useState(false);
    const { isClosed } = useSelector((state: any) => state.isClosed)
    const formikRef = useRef<any>(null);
    
    // Single state object for all date fields
    const [dateValues, setDateValues] = useState({
      // Driver Proofs Check List Section
      driver_licence_received_on: null as DateValue | null,
      driver_licence_checks_completed_on: null as DateValue | null,
      proof_of_address_1_received_on: null as DateValue | null,
      proof_of_address_2_received_on: null as DateValue | null,
      bank_statement_received_on_pre_hire: null as DateValue | null,
      bank_statement_received_on_post_hire: null as DateValue | null,
      taxi_badge_received_on: null as DateValue | null,
      v5_received_on: null as DateValue | null,
      mot_certificate_received_on: null as DateValue | null,
      insurance_certificate_received_on: null as DateValue | null,
      suspension_notice_received_on: null as DateValue | null,
      suspension_uplift_received_on: null as DateValue | null,
      
      // Agreements & Statements Check List Section
      signed_cha_received_on: null as DateValue | null,
      signed_mitigation_received_on: null as DateValue | null,
      arf_received_on: null as DateValue | null,
      signed_cil_agreement_received_on: null as DateValue | null,
    });
    const [initialValues, setInitialValues] = useState({
      // Driver Proofs Check List Section
      driver_licence_received_on: "",
      driver_licence_checks_completed_on: "",
      proof_of_address_1_received_on: "",
      proof_of_address_2_received_on: "",
      bank_statement_received_on_pre_hire: "",
      bank_statement_received_on_post_hire: "",
      taxi_badge_received_on: "",
      v5_received_on: "",
      mot_certificate_received_on: "",
      insurance_certificate_received_on: "",
      suspension_notice_received_on: "",
      suspension_uplift_received_on: "",
      
      // Agreements & Statements Check List Section
      signed_cha_received_on: "",
      signed_mitigation_received_on: "",
      arf_received_on: "",
      signed_cil_agreement_received_on: "",
      
      claim_id: claimID || 0,
    });

    const fetchDriverDocumentAgreement = useCallback(async (claim_id: string) => {
      try {
        const response = await getDriverDocumentAgreement(claim_id);
        const driverDocumentAgreement = response.data || response;
        if (driverDocumentAgreement) {
          setIsEditing(true);
          setInitialValues((prev) => ({
            ...prev,     
            // Driver Proofs Check List Section
            driver_licence_received_on: driverDocumentAgreement.driver_licence_received_on || "",
            driver_licence_checks_completed_on: driverDocumentAgreement.driver_licence_checks_completed_on || "",
            proof_of_address_1_received_on: driverDocumentAgreement.proof_of_address_1_received_on || "",
            proof_of_address_2_received_on: driverDocumentAgreement.proof_of_address_2_received_on || "",
            bank_statement_received_on_pre_hire: driverDocumentAgreement.bank_statement_received_on_pre_hire || "",
            bank_statement_received_on_post_hire: driverDocumentAgreement.bank_statement_received_on_post_hire || "",
            taxi_badge_received_on: driverDocumentAgreement.taxi_badge_received_on || "",
            v5_received_on: driverDocumentAgreement.v5_received_on || "",
            mot_certificate_received_on: driverDocumentAgreement.mot_certificate_received_on || "",
            insurance_certificate_received_on: driverDocumentAgreement.insurance_certificate_received_on || "",
            suspension_notice_received_on: driverDocumentAgreement.suspension_notice_received_on || "",
            suspension_uplift_received_on: driverDocumentAgreement.suspension_uplift_received_on || "",
            
            // Agreements & Statements Check List Section
            signed_cha_received_on: driverDocumentAgreement.signed_cha_received_on || "",
            signed_mitigation_received_on: driverDocumentAgreement.signed_mitigation_received_on || "",
            arf_received_on: driverDocumentAgreement.arf_received_on || "",
            signed_cil_agreement_received_on: driverDocumentAgreement.signed_cil_agreement_received_on || "",
            
            claim_id: claimID || 0,
          }));

          // Set date values for DatePicker components
          setDateValues({
            // Driver Proofs Check List Section
            driver_licence_received_on: driverDocumentAgreement.driver_licence_received_on ? parseCalendarDate(driverDocumentAgreement.driver_licence_received_on) : null,
            driver_licence_checks_completed_on: driverDocumentAgreement.driver_licence_checks_completed_on ? parseCalendarDate(driverDocumentAgreement.driver_licence_checks_completed_on) : null,
            proof_of_address_1_received_on: driverDocumentAgreement.proof_of_address_1_received_on ? parseCalendarDate(driverDocumentAgreement.proof_of_address_1_received_on) : null,
            proof_of_address_2_received_on: driverDocumentAgreement.proof_of_address_2_received_on ? parseCalendarDate(driverDocumentAgreement.proof_of_address_2_received_on) : null,
            bank_statement_received_on_pre_hire: driverDocumentAgreement.bank_statement_received_on_pre_hire ? parseCalendarDate(driverDocumentAgreement.bank_statement_received_on_pre_hire) : null,
            bank_statement_received_on_post_hire: driverDocumentAgreement.bank_statement_received_on_post_hire ? parseCalendarDate(driverDocumentAgreement.bank_statement_received_on_post_hire) : null,
            taxi_badge_received_on: driverDocumentAgreement.taxi_badge_received_on ? parseCalendarDate(driverDocumentAgreement.taxi_badge_received_on) : null,
            v5_received_on: driverDocumentAgreement.v5_received_on ? parseCalendarDate(driverDocumentAgreement.v5_received_on) : null,
            mot_certificate_received_on: driverDocumentAgreement.mot_certificate_received_on ? parseCalendarDate(driverDocumentAgreement.mot_certificate_received_on) : null,
            insurance_certificate_received_on: driverDocumentAgreement.insurance_certificate_received_on ? parseCalendarDate(driverDocumentAgreement.insurance_certificate_received_on) : null,
            suspension_notice_received_on: driverDocumentAgreement.suspension_notice_received_on ? parseCalendarDate(driverDocumentAgreement.suspension_notice_received_on) : null,
            suspension_uplift_received_on: driverDocumentAgreement.suspension_uplift_received_on ? parseCalendarDate(driverDocumentAgreement.suspension_uplift_received_on) : null,
            
            // Agreements & Statements Check List Section
            signed_cha_received_on: driverDocumentAgreement.signed_cha_received_on ? parseCalendarDate(driverDocumentAgreement.signed_cha_received_on) : null,
            signed_mitigation_received_on: driverDocumentAgreement.signed_mitigation_received_on ? parseCalendarDate(driverDocumentAgreement.signed_mitigation_received_on) : null,
            arf_received_on: driverDocumentAgreement.arf_received_on ? parseCalendarDate(driverDocumentAgreement.arf_received_on) : null,
            signed_cil_agreement_received_on: driverDocumentAgreement.signed_cil_agreement_received_on ? parseCalendarDate(driverDocumentAgreement.signed_cil_agreement_received_on) : null,
          });
        }
      } catch (error) {
        console.error('Error fetching driver document agreement:', error);
      }
    }, [claimID]);

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          if (currentClaimId) {
            await fetchDriverDocumentAgreement(currentClaimId);
          }
        };
        loadData();
      }
    }, [id, claimID, fetchDriverDocumentAgreement]);

    const formatDate = (val: string | Date | null) => {
      if (!val) return null;
      const d = new Date(val);
      return d.toISOString().split("T")[0];
    };

    const handleSubmit = async (values: any) => {
      try {
        const storedClaimId = claimID || id;
        const payload = {
          // Driver Proofs Check List Section
          driver_licence_received_on: formatDate(values.driver_licence_received_on),
          driver_licence_checks_completed_on: formatDate(values.driver_licence_checks_completed_on),
          proof_of_address_1_received_on: formatDate(values.proof_of_address_1_received_on),
          proof_of_address_2_received_on: formatDate(values.proof_of_address_2_received_on),
          bank_statement_received_on_pre_hire: formatDate(values.bank_statement_received_on_pre_hire),
          bank_statement_received_on_post_hire: formatDate(values.bank_statement_received_on_post_hire),
          taxi_badge_received_on: formatDate(values.taxi_badge_received_on),
          v5_received_on: formatDate(values.v5_received_on),
          mot_certificate_received_on: formatDate(values.mot_certificate_received_on),
          insurance_certificate_received_on: formatDate(values.insurance_certificate_received_on),
          suspension_notice_received_on: formatDate(values.suspension_notice_received_on),
          suspension_uplift_received_on: formatDate(values.suspension_uplift_received_on),
          
          // Agreements & Statements Check List Section
          signed_cha_received_on: formatDate(values.signed_cha_received_on),
          signed_mitigation_received_on: formatDate(values.signed_mitigation_received_on),
          arf_received_on: formatDate(values.arf_received_on),
          signed_cil_agreement_received_on: formatDate(values.signed_cil_agreement_received_on),
          
          claim_id: storedClaimId || 0,
        };

        if (storedClaimId && isEditing) {
          await updateDriverDocumentAgreement(payload, storedClaimId);
        } else {
          await createDriverDocumentAgreement(payload);
        }
  
        toast.success('Driver Document Agreement saved successfully')
  
        // if (onSuccess) {
        //   onSuccess();
        // }       
        if(handleNext){
          handleNext(11, 'next')
        }
      } catch (error: any) {
        toast.error('Unable to save driver document agreement')
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
        >
          {() => (
          <>
          <div className="border-b border-cloudGray mb-5">
            <h2 className="text-secondary text-lg font-semibold">
            Driver Proofs
            </h2>
            <p className="pb-5 text-lightGray text-sm font-normal">Enter details for Driver Proofs</p>
          </div>
          <form className="space-y-4">
            {/* Driver Proofs Check List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="driver_licence_received_on">Driving Licence Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                <Field name="driver_licence_received_on">
                    {({ form }: any) => (
                    <DatePicker
                      maxValue={today(getLocalTimeZone())}
                      isDisabled={isClosed}
                        value={dateValues.driver_licence_received_on}
                      onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, driver_licence_received_on: newDate }));
                        form.setFieldValue("driver_licence_received_on", newDate);
                      }}
                      className="w-full"
                    />
                  )}
                </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="driver_licence_checks_completed_on">Driving Licence Checks Completed On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="driver_licence_checks_completed_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.driver_licence_checks_completed_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, driver_licence_checks_completed_on: newDate }));
                          form.setFieldValue("driver_licence_checks_completed_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="proof_of_address_1_received_on">Proof of Address 1 Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="proof_of_address_1_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.proof_of_address_1_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, proof_of_address_1_received_on: newDate }));
                          form.setFieldValue("proof_of_address_1_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="proof_of_address_2_received_on">Proof of Address 2 Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="proof_of_address_2_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.proof_of_address_2_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, proof_of_address_2_received_on: newDate }));
                          form.setFieldValue("proof_of_address_2_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="bank_statement_received_on_pre_hire">Bank Statement Received On (Pre-Hire)</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="bank_statement_received_on_pre_hire">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.bank_statement_received_on_pre_hire}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, bank_statement_received_on_pre_hire: newDate }));
                          form.setFieldValue("bank_statement_received_on_pre_hire", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="bank_statement_received_on_post_hire">Bank Statement Received On (Post-Hire)</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="bank_statement_received_on_post_hire">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.bank_statement_received_on_post_hire}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, bank_statement_received_on_post_hire: newDate }));
                          form.setFieldValue("bank_statement_received_on_post_hire", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="taxi_badge_received_on">Taxi Badge Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="taxi_badge_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.taxi_badge_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, taxi_badge_received_on: newDate }));
                          form.setFieldValue("taxi_badge_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="v5_received_on">V5 Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="v5_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.v5_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, v5_received_on: newDate }));
                          form.setFieldValue("v5_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="mot_certificate_received_on">MOT Certificate Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="mot_certificate_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.mot_certificate_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, mot_certificate_received_on: newDate }));
                          form.setFieldValue("mot_certificate_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="insurance_certificate_received_on">Insurance Certificate Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="insurance_certificate_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.insurance_certificate_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, insurance_certificate_received_on: newDate }));
                          form.setFieldValue("insurance_certificate_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="suspension_notice_received_on">Suspension Notice Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="suspension_notice_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.suspension_notice_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, suspension_notice_received_on: newDate }));
                          form.setFieldValue("suspension_notice_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
                </div>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="suspension_uplift_received_on">Suspension UPLIFT Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="suspension_uplift_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.suspension_uplift_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, suspension_uplift_received_on: newDate }));
                          form.setFieldValue("suspension_uplift_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>
          
            <div className="mt-8 border-t border-cloudGray" />
          </form>



          <div className="border-b border-cloudGray my-5">
            <h2 className="text-secondary text-lg font-semibold">
            Agreements & Statements
            </h2>
            <p className="pb-5 text-lightGray text-sm font-normal">Enter details for Agreements & Statements</p>
          </div>
          <form className="space-y-4">
            {/* Agreements & Statements Check List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="signed_cha_received_on">Signed CHA Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                <Field name="signed_cha_received_on">
                    {({ form }: any) => (
                    <DatePicker
                      maxValue={today(getLocalTimeZone())}
                      isDisabled={isClosed}
                        value={dateValues.signed_cha_received_on}
                      onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, signed_cha_received_on: newDate }));
                        form.setFieldValue("signed_cha_received_on", newDate);
                      }}
                      className="w-full"
                    />
                  )}
                </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="signed_mitigation_received_on">Signed Mitigation Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="signed_mitigation_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.signed_mitigation_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, signed_mitigation_received_on: newDate }));
                          form.setFieldValue("signed_mitigation_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="arf_received_on">ARF Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="arf_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.arf_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, arf_received_on: newDate }));
                          form.setFieldValue("arf_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
                </div>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="col-span-3 lg:col-span-1">
                <Label htmlFor="signed_cil_agreement_received_on">Signed CIL Agreement Received On</Label>
              </div>
              <div className="col-span-3 lg:col-span-2">
                <div className="w-full">
                  <Field name="signed_cil_agreement_received_on">
                    {({ form }: any) => (
                      <DatePicker
                        maxValue={today(getLocalTimeZone())}
                        isDisabled={isClosed}
                        value={dateValues.signed_cil_agreement_received_on}
                        onChange={(newDate) => {
                          setDateValues(prev => ({ ...prev, signed_cil_agreement_received_on: newDate }));
                          form.setFieldValue("signed_cil_agreement_received_on", newDate);
                        }}
                        className="w-full"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>
          
            <div className="mt-8 border-t border-cloudGray" />
          </form>
          </>
          )}
        </Formik>
      </div>
    );
  }
);

DriverDocumentAgreement.displayName = "DriverDocumentAgreement";

export default DriverDocumentAgreement;
