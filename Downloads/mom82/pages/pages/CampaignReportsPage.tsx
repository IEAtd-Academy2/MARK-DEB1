import React, { useState, useEffect } from 'react';
import { CampaignReport } from '../types';
import { DataService } from '../services/dataService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CampaignReportsPage: React.FC = () => {
    const [reports, setReports] = useState<CampaignReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newReport, setNewReport] = useState<Partial<CampaignReport>>({
        campaign_name: '',
        report_link: '',
        duration_months: 0,
        duration_years: 0
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await DataService.getCampaignReports();
            setReports(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newReport.campaign_name || !newReport.report_link) return;
        try {
            await DataService.createCampaignReport(newReport);
            setShowModal(false);
            setNewReport({ campaign_name: '', report_link: '', duration_months: 0, duration_years: 0 });
            fetchReports();
        } catch (error) {
            console.error(error);
            alert('Failed to save report');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">تقارير الحملات</h1>
                    <p className="text-gray-500">أرشيف شامل لجميع تقارير الحملات الإعلانية</p>
                </div>
                <Button onClick={() =>