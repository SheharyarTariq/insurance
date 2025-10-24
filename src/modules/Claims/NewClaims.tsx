import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ClientsDetails from "../../components/NewClaims/ClientDetails";
import GeneralDetails from "../../components/NewClaims/GeneralDetails";
import ReferrerDetails from "../../components/NewClaims/ReferrerDetails";
import AccidentDetails from "../../components/NewClaims/AccidentDetails";
import VehicleOwnerDetails from "../../components/NewClaims/VehicleOwner";
import VehicleDetails from "../../components/NewClaims/VehicleDetails";
import Siderbar from "../../components/Claims/Sidebar/sidebar";
import { getClaimById } from "../../services/Claims/Claims";
import { useSelector } from "react-redux";
import EngineerDetails from "../../components/NewClaims/EngineerDetails";
import RepairCosts from "../../components/NewClaims/RepairCosts";
import TotalLossDetail from "../../components/NewClaims/TotalLossDetail";
import ClientInsurerDetails from "../../components/NewClaims/ClientInsurerDetails";
import PanelSolicitorDetails from "../../components/NewClaims/PanelSolicitorDetails";
import StorageRecovery from "../../components/NewClaims/StorageRecovery";
import ThirdPartyInsurer from "../../components/NewClaims/ThirdPartyInsurer";
import VehicleDamageForm from "../../components/NewClaims/VehicleDamage";
import DriverDocumentAgreement from "../../components/NewClaims/DriverDocumentAgreement";
import HireDetails from "../../components/NewClaims/HireDetails";
import HireVehicleProvided from "../../components/NewClaims/HireVehicleProvided";

const ClaimsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [claimData, setClaimData] = useState<any>(null);
  const [loading, setLoading] = useState(!!id);

  const generalFormRef = useRef<any>(null);
  const referrerFormRef = useRef<any>(null);
  const clientFormRef = useRef<any>(null);
  const accidentFormRef = useRef<any>(null);
  const vehicleFormRef = useRef<any>(null);
  const vehicleOwnerFormRef = useRef<any>(null);
  const engineerDetailsFormRef = useRef<any>(null);
  const repairCoastFormRef = useRef<any>(null);
  const totalLossFormRef = useRef<any>(null);
  const clientInsurerFormRef = useRef<any>(null);
  const panelSolicitorDetailsFormRef = useRef<any>(null);
  const storageRecoveryFormRef = useRef<any>(null);
  const vehicleDamageFormRef = useRef<any>(null)
  const thirdPartyInsurerFormRef = useRef<any>(null);
  const driverDocumentAgreementFormRef = useRef<any>(null);
  const hireDetailsFormRef = useRef<any>(null);
  const hireVehicleProvidedFormRef = useRef<any>(null);
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get('claimid');
  const { isClosed, referrence_no } = useSelector((state: any) => state.isClosed)

  useEffect(() => {
    const currentClaimId = claimID || id;

    if (currentClaimId) {
      const fetchClaimData = async () => {
        try {
          setLoading(true);
          const data = await getClaimById(parseInt(currentClaimId));
          setClaimData(data);
        } catch (error) {
          console.error("Failed to fetch claim data:", error);
          setSubmitError("Failed to load claim data");
        } finally {
          setLoading(false);
        }
      };

      fetchClaimData();
    }
  }, [id, claimID, step]);


  const handleNext = async (param: any, key: string) => {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      let formikInstance;

      switch (step) {
        case 1:
          formikInstance = generalFormRef.current;
          break;
        case 2:
          formikInstance = referrerFormRef.current;
          break;
        case 3:
          formikInstance = clientFormRef.current;
          break;
        case 4:
          formikInstance = accidentFormRef.current;
          break;
        case 5:
          formikInstance = vehicleFormRef.current;
          break;
        case 6:
          formikInstance = vehicleOwnerFormRef.current;
          break;
        case 7:
          formikInstance = engineerDetailsFormRef.current;
          break;
        case 8:
          formikInstance = repairCoastFormRef.current;
          break;
        case 9:
          formikInstance = totalLossFormRef.current;
          break;
        case 10:
          formikInstance = clientInsurerFormRef.current;
          break;
        case 11:
          formikInstance = panelSolicitorDetailsFormRef.current;
          break;
        case 12:
          formikInstance = storageRecoveryFormRef.current;
          break;
        case 13:
          formikInstance = vehicleDamageFormRef.current;
          break;
        case 14:
          formikInstance = thirdPartyInsurerFormRef.current;
          break;  
        case 15:
          formikInstance = driverDocumentAgreementFormRef.current;
          break;  
        case 16:
          formikInstance = hireDetailsFormRef.current;
          break;  
        case 17:
          formikInstance = hireVehicleProvidedFormRef.current;
          break;        
      }

      if (key === 'sideBar') {
        setStep(param);
        return;
      }

      if (formikInstance) {
        await formikInstance.submitForm();

        await new Promise((resolve) => setTimeout(resolve, 50));

        if (formikInstance.errors && Object.keys(formikInstance.errors).length > 0) {
          return;
        }
      }

      if (!completedSteps.includes(step)) {
        setCompletedSteps([...completedSteps, step]);
      }


      if (param <= 17 && key === 'next') {
        setStep(step + 1);
      } else if(param === 14 && key === 'next') {
        navigate('/claims')
      }

    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSidebarNavigation = (stepNumber: number) => {
    setStep(stepNumber);
    handleNext(stepNumber, "sideBar")
  };


  const renderStep = () => {

    switch (step) {
      case 1:
        return (
          <GeneralDetails
            ref={generalFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 2:
        return (
          <ReferrerDetails
            ref={referrerFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 3:
        return (
          <ClientsDetails
            ref={clientFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 4:
        return (
          <AccidentDetails
            ref={accidentFormRef}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 5:
        return (
          <VehicleDetails
            ref={vehicleFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 6:
        return (
          <VehicleOwnerDetails
            ref={vehicleOwnerFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 7:
        return (
          <EngineerDetails
            ref={engineerDetailsFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 8:
        return (
          <RepairCosts
            ref={repairCoastFormRef}
            claimData={claimData}
            handleNext={handleNext}
          />
        );
      case 9:
        return (
          <TotalLossDetail
            ref={totalLossFormRef}
            handleNext={handleNext}
          />
        );
      case 10:
        return(
          <ClientInsurerDetails
            ref={clientInsurerFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 11:
        return(
          <PanelSolicitorDetails
            ref={panelSolicitorDetailsFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 12:
        return(
          <StorageRecovery
            ref={storageRecoveryFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 13:
        return(
          <VehicleDamageForm
            ref={vehicleDamageFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
      case 14:
        return(
          <ThirdPartyInsurer
            ref={thirdPartyInsurerFormRef}
            claimData={claimData}
            isEditMode={!!id}
            handleNext={handleNext}
          />
        );
        case 15:
          return(
            <DriverDocumentAgreement
              ref={driverDocumentAgreementFormRef}
              claimData={claimData}
              isEditMode={!!id}
              handleNext={handleNext}
            />
          );
          case 16:
            return(
              <HireDetails
                ref={hireDetailsFormRef}
                claimData={claimData}
                isEditMode={!!id}
                handleNext={handleNext}
              />
            );
          case 17:
            return(
              <HireVehicleProvided
                ref={hireVehicleProvidedFormRef}
                claimData={claimData}
                isEditMode={!!id}
                handleNext={handleNext}
              />
            );
      
      default:
        return (
          <GeneralDetails
            ref={generalFormRef}
            claimData={claimData}
            isEditMode={!!id}
          />
        );

    }
  };
  

  if (loading || isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom"></div>
      </div>
    );
  }

  return (
    <div className="pt-4 sm:pt-8  px-4 sm:pl-6 sm:pr-4 lg:pl-24 lg:pr-10  ">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
        <div>
          <button
            className="flex items-center gap-2 py-4 sm:py-6 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={handleBack}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-md">
              {step === 1 ? "Back to queue" : "Back"}
            </span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
              {(id || claimID) && (referrence_no !== '')
                ? `${referrence_no}`
                : "Add New Claim"}
            </h1>

          </div>
          {!isClosed && <div className="flex gap-2 sm:gap-3 mr-[-5px] font-semibold text-xs sm:text-sm">
            <button
              className="px-3 sm:px-4 py-1 sm:py-2 text-gray-700 bg-white rounded-lg border shadow hover:bg-gray-50 transition-colors"
              onClick={() => navigate("/claims")}
            >
              Discard
            </button>
            {step < 17 ? <button
              onClick={() => handleNext(step + 1, 'next')}
              disabled={isSubmitting}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${!isSubmitting
                ? "text-white bg-custom hover:bg-[#252B37]"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
                }`}
            >
              {isSubmitting
                ? "Processing..."
                : step < 17
                  ? "Save & Next"
                  : id && step < 17
                    ? "Save & Next"
                    : "Save"}
            </button> : <button
              onClick={() => handleNext(17, 'next')}
              
              disabled={isSubmitting}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${!isSubmitting
                ? "text-white bg-custom hover:bg-[#000]"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
                }`}
            >
              {isSubmitting
                ? "Processing..."
                : "Save"}
            </button>}
          
          </div>}

        </div>
        {submitError && (
          <div className="text-red-500 text-sm mt-2">{submitError}</div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <div className="lg:w-64 flex">
          <Siderbar
            currentStep={step}
            completedSteps={completedSteps}
            onNavigate={handleSidebarNavigation}
          />
        </div>
        {/* Main Form Content */}
        <div className="flex-1 ">{renderStep()}</div>
      </div>
    </div>
  );
};

export default ClaimsForm;