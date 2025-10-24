import { Formik, Form, Field, useFormik, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import CustomSelect from '../ReactSelect/ReactSelect';
import LeafletAutocompleteMap from '../GoogleMapAutoComplete/GoogleMapAutoComplete.tsx';
import { MdArrowOutward } from 'react-icons/md';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { UserPlus2 } from "lucide-react";
import { useEffect, useState } from 'react';
import {
    createWitness,
    getWitnessById,
    sendEmail, updateWitness,
} from '../../services/Accidents/Cards/Cards.tsx';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getClaimById } from "../../services/Claims/Claims.tsx";
import { PulseLoader } from 'react-spinners';

interface AddWitnessModalProps {
    isOpen: boolean;
    onClose: (shouldRefresh?: boolean) => void;
    onConfirm: (witness: any) => void;

}

interface QuestionnaireFormValues {
    emailOption: string;
    sendReminders: boolean;
}

interface SendQuestionnaireModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (method: string, sendReminders: boolean) => void;
    witnessEmail: string;
}

const SendQuestionnaireModal = ({ isOpen, onClose, onSend, loading, witnessEmail }: SendQuestionnaireModalProps) => {

    const emailOptions = [
        { value: "link", label: "Send secured digital form link" },
        { value: "pdf", label: "Email as PDF attachment" },
        { value: "download", label: "Download for Postal Delivery" }
    ];
    const formik = useFormik<QuestionnaireFormValues>({
        initialValues: {
            emailOption: '',
            sendReminders: false,
        },
        onSubmit: (values) => {
            onSend(witnessEmail, values.sendReminders, values.emailOption);
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-4 shadow-xl">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4 text-center">Send Questionnaire</h2>
                    <p className="text-sm text-gray-600 mb-6 text-center">
                        Choose how you want to send the questionnaire
                    </p>

                    <form onSubmit={formik.handleSubmit}>
                        <div className="mb-6">
                            <div className="mb-4">
                                <CustomSelect
                                    options={emailOptions}
                                    placeholder='Email as pdf attachment '
                                    value={formik.values.emailOption}
                                    onChange={(value) => formik.setFieldValue('emailOption', value)}
                                    name="emailOption"
                                />
                            </div>
                            <div className="flex items-center p-3">
                                <input
                                    type="checkbox"
                                    id="sendReminders"
                                    name="sendReminders"
                                    checked={formik.values.sendReminders}
                                    onChange={formik.handleChange}
                                    className="mr-3"
                                />
                                <label htmlFor="sendReminders" className="cursor-pointer text-sm">
                                    Send reminders if there is no response
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-custom text-white rounded-md hover:bg-[#252B37] transition-colors duration-200"
                            >
                                {loading ? <PulseLoader size={10} speedMultiplier={1} color="#ffffff"/> : 'Send'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const AddWitnessModal = ({ isOpen, onClose, onConfirm, editingWitnessId }: AddWitnessModalProps) => {
    const isClosed = useSelector((state: any) => state.isClosed?.isClosed);
    const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
    const { id } = useParams()
    const { referrence_no } = useSelector((state) => state.isClosed)
    const ref = localStorage.getItem('reference_number')
    const [loading, setLoading] = useState(false)
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get('claimid');
    const [isFetching, setIsFetching] = useState(false);
    const [claimType, setClaimType] = useState<number | null>(null);

    const [initialValues, setInitialValues] = useState({
        title: 'mr',
        firstName: '',
        surname: '',
        address: '',
        postcode: '',
        created_at: '',
        phone: '',
        email: '',
        isIndependent: 'Yes',
        questionnaireSentDate: '',
        questionnaireSentTime: ''
    })

    useEffect(() => {
        const fetchClaimData = async () => {
            try {
                const data = await getClaimById(parseInt(id || claimID));
                const type = data?.claim_type_id ?? null;
                setClaimType(type);
                setInitialValues(prev => ({
                    ...prev,
                    isIndependent: type === 1 ? "Yes" : "No",
                }));
            } catch (error) {
                console.error("Failed to fetch claim data:", error);
            }
        };

        fetchClaimData();
    }, []);


    useEffect(() => {
        if (!editingWitnessId) return;

        const fetchWitnessDetails = async () => {
            try {
                setIsFetching(true);
                const res = await getWitnessById(editingWitnessId);
                setInitialValues(mapWitnessToInitialValues(res));
            } catch (e) {
                console.error("Failed to fetch passenger", e);
                // optional: show toast or API error banner
            } finally {
                setIsFetching(false);
            }
        };

        fetchWitnessDetails();
    }, [editingWitnessId]);

    const sanitizePhone = (v: any) => String(v ?? "");
    const normalizeTitleFromGender = (g: any) => {
        const s = String(g ?? "").toLowerCase();
        if (s.startsWith("mr")) return "mr";
        if (s.startsWith("mrs")) return "mrs";
        if (s.startsWith("ms")) return "ms";
        if (s.startsWith("miss")) return "miss";
        if (s.startsWith("dr")) return "dr";
        return "mr";
    };

    function mapWitnessToInitialValues(res: any) {
        const addr = res?.address ?? {};
        return {
            title: normalizeTitleFromGender(res?.gender),
            firstName: res?.first_name ?? "",
            surname: res?.surname ?? "",
            address: addr?.address ?? "",
            postcode: addr?.postcode ?? "",
            created_at: res?.created_at ?? "",
            phone: sanitizePhone(addr?.mobile_tel),
            email: addr?.email ?? "",
            questionnaireSentDate: "",
            questionnaireSentTime: "",
            isIndependent:
                claimType === 1 ? 'Yes' : 'No',
        };
    }


    const validationSchema = Yup.object().shape({
        firstName: Yup.string().required('First name is required'),
        surname: Yup.string().required('Surname is required'),
        address: Yup.string().required('Address is required'),
        postcode: Yup.string().required('Postcode is required'),
        phone: Yup.string().required('Phone number is required'),
        email: Yup.string().email('Invalid email format').required('Email is required'),
        isIndependent: Yup.string().required('Please specify if witness is independent'),
    });

    const handlePlaceSelected = (place: any, formik: any) => {
        if (formik) {
            formik.setFieldValue('address', place.name);
            formik.setFieldValue('postcode', place.postalCode);
        }
    };


    function formatDateTime(isoString) {
        const date = new Date(isoString);

        const formattedDate = date.toLocaleDateString('en-CA');
        const formattedTime = date.toLocaleTimeString('en-GB');

        return {
            date: formattedDate,
            time: formattedTime
        };
    }


    const handleSubmit = async (values: any) => {
        try {
            const witnessData = {
                name: `${values.firstName} ${values.surname}`,
                contact: values.phone,
                gender: values.title,
                first_name: values.firstName,
                claim_id: parseInt(claimID || id),
                surname: values.surname,
                address: {
                    address: values.address,
                    postcode: values.postcode,
                    mobile_tel: values.phone,
                    email: values.email
                },
                email: values.email,
                witness_independent: values.isIndependent === "Yes"
            };

            if (editingWitnessId) {
                await updateWitness(editingWitnessId, witnessData)
            } else {
                await createWitness(witnessData);
            }
            onClose(true);



        } catch (error) {
            console.error('Error submitting witness details:', error);
            const fallbackWitness = {
                id: Date.now(),
                ...values
            };
            onConfirm(fallbackWitness);
        }
    };
    const handleSendQuestionnaire = () => {
        setIsQuestionnaireModalOpen(true);
    };

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

    const handleDownload = (response: any) => {
        const { zip_base64, filename } = response;

        const binaryString = atob(zip_base64);

        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'application/zip' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'download.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="p-8">
                        <div className="flex justify-center">
                            <div className='rounded-full border-8 border-gray-300/10'>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-custom">
                                    <UserPlus2 className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold mb-2 text-center">{editingWitnessId ? `${initialValues.firstName} ${initialValues.surname}` : 'Add Witness Details'}</h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            {editingWitnessId ? 'Update' : 'Enter'} the witness details below
                        </p>

                        <Formik
                            key={editingWitnessId ?? "new"}
                            initialValues={initialValues}
                            validationSchema={validationSchema}
                            onSubmit={handleSubmit}
                            enableReinitialize={true}
                        >
                            {(formik) => {
                                const handleQuestionnaireSend = async (
                                    email: string,
                                    sendReminders: boolean,
                                    option: any
                                ) => {
                                    const firstName = formik.values.firstName;
                                    const now = new Date();
                                    const formattedDate = now.toISOString().split("T")[0];
                                    const formattedTime = now.toTimeString().split(" ")[0].substring(0, 5);
                                    setLoading(true)
                                    try {
                                        const res = await sendEmail(
                                            email,
                                            claimID || id,
                                            firstName,
                                            referrence_no || ref,
                                            option
                                        );

                                        if (res?.link) {
                                            const subject = "Witness Questionnaire";
                                            const body =
                                                `Dear ${res.client_detail.witness_name},\n\n` +
                                                `Please use the following secure link to complete the questionnaire:\n\n` +
                                                `<${res.link}>\n\n` +
                                                `Claim Reference: ${res.client_detail.reference}\n` +
                                                `Client Name: ${res.client_detail.name}\n` +
                                                `Witness: ${res.client_detail.witness_name}\n` +
                                                `Date: ${res.client_detail.witness_date}\n\n` +
                                                `Regards,\nClaims Team`;

                                            openOutlookCompose(email, subject, body);
                                            toast.success('Email sent successfully')
                                        } else if (res?.zip_base64) {
                                            handleDownload(res)
                                            toast.success('Form and letter downloaded successfully')
                                        }
                                        formik.setFieldValue("questionnaireSentDate", formattedDate);
                                        formik.setFieldValue("questionnaireSentTime", formattedTime);

                                    } catch (e) {
                                        console.error("Unable to send email / open compose:", e);
                                    } finally {
                                        setIsQuestionnaireModalOpen(false);
                                        setLoading(false)
                                    }
                                };

                                return (
                                    <>
                                        <Form>
                                            <div className="mb-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Title
                                                        </label>
                                                        <Field name="title">
                                                            {({ field, form }: any) => {
                                                                const titleOptions = [
                                                                    { value: "mr", label: "Mr." },
                                                                    { value: "mrs", label: "Mrs." },
                                                                    { value: "ms", label: "Ms." },
                                                                    { value: "miss", label: "Miss" },
                                                                    { value: "dr", label: "Dr." },
                                                                ];

                                                                return (
                                                                    <CustomSelect
                                                                        options={titleOptions}
                                                                        value={titleOptions.find((opt) => opt.value === field.value) || titleOptions[0]}
                                                                        onChange={(option) => {
                                                                            form.setFieldValue(field.name, option ? option.value : "");
                                                                        }}
                                                                        disabled={isClosed}
                                                                    />
                                                                );
                                                            }}
                                                        </Field>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            First Name
                                                        </label>
                                                        <Field
                                                            type="text"
                                                            name="firstName"
                                                            placeholder="First Name"
                                                            style={{ height: '44px' }}
                                                            disabled={isClosed}
                                                            className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                                        />
                                                        <ErrorMessage name="firstName" component="div" className="text-red-500 text-xs mt-1" />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Surname
                                                        </label>
                                                        <Field
                                                            type="text"
                                                            name="surname"
                                                            placeholder="Surname"
                                                            style={{ height: '44px' }}
                                                            disabled={isClosed}
                                                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                                                        />
                                                        <ErrorMessage name="surname" component="div" className="text-red-500 text-xs mt-1" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="grid grid-cols-1 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Address
                                                        </label>
                                                        <LeafletAutocompleteMap
                                                            showMap={false}
                                                            apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                                                            address={formik.values.address}
                                                            onPlaceSelected={(place) => handlePlaceSelected(place, formik)}
                                                            disabled={isClosed}
                                                        />
                                                        <ErrorMessage name="address" component="div" className="text-red-500 text-xs mt-1" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Postcode
                                                        </label>
                                                        <Field
                                                            type="text"
                                                            name="postcode"
                                                            style={{ height: '44px' }}
                                                            disabled={isClosed}
                                                            className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                                        />
                                                        <ErrorMessage name="postcode" component="div" className="text-red-500 text-xs mt-1" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Phone number
                                                        </label>
                                                        <Field name="phone">
                                                            {({ field, form }: any) => (
                                                                <PhoneInput
                                                                    country={'gb'}
                                                                    value={field.value}
                                                                    onChange={(phone) => form.setFieldValue('phone', phone)}
                                                                    inputStyle={{
                                                                        width: '100%',
                                                                        height: '44px',
                                                                        paddingLeft: '48px'
                                                                    }}
                                                                    containerClass="w-full"
                                                                    disabled={isClosed}
                                                                />
                                                            )}
                                                        </Field>
                                                        <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Email
                                                        </label>
                                                        <Field
                                                            type="email"
                                                            name="email"
                                                            placeholder="olivia@untitledui.com"
                                                            disabled={isClosed}
                                                            className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-500 focus:outline-none transition-all duration-200"
                                                        />
                                                        <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Witness Independent
                                                        </label>
                                                        <Field name="isIndependent">
                                                            {({ field, form }: any) => {
                                                                const options = [
                                                                    { value: "Yes", label: "Yes" },
                                                                    { value: "No", label: "No" },
                                                                ];

                                                                const current = String(field.value ?? "No");
                                                                return (
                                                                    <CustomSelect
                                                                        name={field.name}
                                                                        options={options}
                                                                        placeholder="Select…"
                                                                        value={options.find((opt) => opt.value === current) || null}
                                                                        onChange={(option: { value: string } | null) => {
                                                                            form.setFieldValue(field.name, option?.value ?? "");
                                                                        }}
                                                                        onBlur={() => form.setFieldTouched(field.name, true)}
                                                                        isDisabled={isClosed}
                                                                    />
                                                                );
                                                            }}
                                                        </Field>

                                                    </div>
                                                </div>

                                                {editingWitnessId && (
                                                    <div className="grid g gap-4 mb-4 bg-gray-50 p-3 rounded-md">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Questionnaire was sent on
                                                        </label>
                                                        <div className="md:col-span-2">
                                                            <p className="text-sm">
                                                                {formatDateTime(initialValues.created_at).date} at {formatDateTime(initialValues.created_at).time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex mt-4">
                                                    <div
                                                        className='flex cursor-pointer'
                                                        onClick={handleSendQuestionnaire}
                                                    >
                                                        <h2 className="text-sm cursor-pointer mb-4 font-semibold text-[#414651]">
                                                            Send Questionnaire
                                                        </h2>
                                                        <MdArrowOutward className='text-[#414651] mt-[3px] ml-2' />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-custom text-white rounded-md hover:bg-[#252B37] transition-colors duration-200"
                                                >
                                                    Confirm
                                                </button>
                                            </div>
                                        </Form>

                                        <SendQuestionnaireModal
                                            isOpen={isQuestionnaireModalOpen}
                                            onClose={() => setIsQuestionnaireModalOpen(false)}
                                            onSend={handleQuestionnaireSend}
                                            loading={loading}
                                            witnessEmail={formik.values.email || ''}
                                        />
                                    </>
                                )

                            }}
                        </Formik>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddWitnessModal;