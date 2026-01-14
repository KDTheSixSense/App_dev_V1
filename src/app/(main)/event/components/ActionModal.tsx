'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: () => Promise<void> | void;
    title: string;
    children: React.ReactNode;
    actionLabel: string;
    variant?: 'primary' | 'danger' | 'warning' | 'success';
    isLoading?: boolean;
}

export const ActionModal = ({
    isOpen,
    onClose,
    onAction,
    title,
    children,
    actionLabel,
    variant = 'primary',
    isLoading = false,
}: ActionModalProps) => {

    const getButtonClass = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning':
                return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
            case 'success':
                return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500';
            case 'primary':
            default:
                return 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !isLoading && onClose()}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/80 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2">
                                    {variant === 'danger' && <FiAlertTriangle className="text-red-500" />}
                                    {title}
                                </Dialog.Title>
                                <div className="mt-2">
                                    <div className="text-sm text-gray-500">
                                        {children}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isLoading}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onAction}
                                        disabled={isLoading}
                                        className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonClass()}`}
                                    >
                                        {isLoading ? '処理中...' : actionLabel}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
