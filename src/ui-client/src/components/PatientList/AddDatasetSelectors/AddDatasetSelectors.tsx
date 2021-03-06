/* Copyright (c) 2019, UW Medicine Research IT, University of Washington
 * Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */ 

import React from 'react';
import { Col, Row, Button, Input } from 'reactstrap';
import { getPatientListDataset } from '../../../actions/cohort/patientList';
import { DateBoundary } from '../../../models/panel/Date';
import { PatientListDatasetQueryDTO, CategorizedDatasetRef } from '../../../models/patientList/Dataset';
import { PatientListConfiguration } from '../../../models/patientList/Configuration';
import { searchPatientListDatasets, setDatasetSearchTerm } from '../../../actions/generalUi';
import { DatasetsState } from '../../../models/state/GeneralUiState';
import { keys } from '../../../models/Keyboard';

interface Props {
    categoryIdx: number;
    className?: string;
    configuration: PatientListConfiguration;
    datasetIdx: number;
    dates: DateBoundary[];
    datasets: DatasetsState;
    dispatch: any;
    handleDatasetSelect: (categoryIdx: number, datasetIdx: number) => void;
    handleDateSelect: (date: DateBoundary) => void;
    selectedDates: DateBoundary;
}

let dsCount = 0;

export default class AddDatasetSelectors extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);
    }

    public getSnapshotBeforeUpdate() {
        const { datasets, handleDatasetSelect } = this.props;
        const newDsCount = datasets.available.reduce((a: number, b: CategorizedDatasetRef) => a + b.datasets.length, 0);

        if (newDsCount && dsCount !== newDsCount) {
            dsCount = newDsCount;
            handleDatasetSelect(0, 0);
        }
        return null;
    }

    public componentDidUpdate() { }

    public handleSearchInputChange = (e: React.FormEvent<HTMLInputElement>) => {
        const { dispatch } = this.props;
        const term = e.currentTarget.value;
        dispatch(searchPatientListDatasets(term));
        dispatch(setDatasetSearchTerm(term));
    }

    public render() {
        const { datasets, className, dates } = this.props;
        const c = className ? className : 'patientlist-add-dataset';
        return (
            <div>
                <Row>
                    <Col md={7} className={`${c}-select-col-left`}>
                        <Input
                            className={`${className}-input leaf-input`} 
                            onChange={this.handleSearchInputChange}
                            onKeyDown={this.handleSearchKeydown}
                            placeholder="Search..." 
                            spellCheck={false}
                            value={datasets.searchTerm} />
                        <div className={`${c}-select-datasets-list`}>
                        {datasets.available.length === 0 &&
                        <div className={`${c}-select-nodatasets`}>
                            No datasets found. Try refining your search.
                        </div>
                        }
                        {datasets.available.map((cat: CategorizedDatasetRef, catIdx: number) => {
                            return (
                            <div className={`${c}-select-category`} key={cat.category}>
                                <div className={`${c}-select-category-name`}>{cat.category}</div>
                                {cat.datasets.map((d: PatientListDatasetQueryDTO, dsIdx: number) => {
                                    return (
                                        <div 
                                            key={d.id} 
                                            className={this.setDatasetOptionClass(catIdx, dsIdx)} 
                                            onClick={this.handleDatasetOptionClick.bind(null, catIdx, dsIdx)}
                                            onDoubleClick={this.handleDatasetRequest}
                                            onKeyDown={this.handleSearchKeydown}
                                            tabIndex={0}>
                                            {d.name}
                                        </div>
                                    );
                                })}
                            </div>)
                        })}
                        </div>
                    </Col>
                    <Col md={5} className={`${c}-select-col-right`}>
                        {dates.map((d: DateBoundary) => {
                            return (
                                <div 
                                    key={d.display} 
                                    className={this.setDateOptionClass(d)}
                                    onClick={this.handleDateOptionClick.bind(null, d)}
                                    onKeyDown={this.handleSearchKeydown}
                                    tabIndex={0}>
                                    {d.display}
                                </div>
                            );
                        })}
                    </Col>
                </Row>
                <div className={`${c}-select-footer`}>
                    <Button 
                        className="leaf-button leaf-button-primary" 
                        disabled={datasets.available.length === 0}
                        onClick={this.handleDatasetRequest}
                        style={{ float: 'right' }}>
                        Add Dataset
                    </Button>
                </div>
            </div>
        )
    }

    private handleSearchKeydown = (k: React.KeyboardEvent<HTMLInputElement>) => {
        const { datasets } = this.props;
        const key = (k.key === ' ' ? keys.Space : keys[k.key as any]);
        if (!key || !datasets.available.length) { return; }

        switch (key) {
            case keys.ArrowUp: 
            case keys.ArrowDown:
                this.handleArrowUpDownKeyPress(key);
                k.preventDefault();
                break;
            case keys.Enter:
                this.handleDatasetRequest();
                break;
        }
    }

    private handleArrowUpDownKeyPress = (key: number) => {
        const { handleDatasetSelect } = this.props;

        const newIdxs = this.calculateNewDatasetAfterKeypress(key);
        handleDatasetSelect(newIdxs[0], newIdxs[1]);
    }

    private calculateNewDatasetAfterKeypress = (key: number): [ number, number ] => {
        const { datasets, categoryIdx, datasetIdx } = this.props;

        const totalCategories = datasets.available.length;
        const minDs = 0;
        const minCat = 0;
        const maxCat = totalCategories - 1;

        let newCatIdx = categoryIdx;
        let newDsIdx = datasetIdx;

        if (totalCategories > 1) {
            if (key === keys.ArrowUp) {
                if (categoryIdx === minCat) {
                    newCatIdx = datasetIdx === minDs ? maxCat : categoryIdx;
                } else {
                    newCatIdx = datasetIdx === minDs ? categoryIdx - 1 : categoryIdx;
                }
            } else if (key === keys.ArrowDown) {
                const maxDs = datasets.available[categoryIdx].datasets.length - 1;
                if (categoryIdx === maxCat) {
                    newCatIdx = datasetIdx === maxDs ? minCat : categoryIdx
                } else {
                    newCatIdx = datasetIdx === maxDs ? categoryIdx + 1 : categoryIdx;
                }
            }
        }

        const cat = datasets.available[newCatIdx];
        const totalDatasets = cat.datasets.length;
        const maxDs = totalDatasets - 1;

        if (totalDatasets > 1) {
            if (newCatIdx === categoryIdx + 1) {
                newDsIdx = 0;
            } else if (newCatIdx > categoryIdx) {
                newDsIdx = maxDs;
            } else if (newCatIdx === categoryIdx - 1) {
                newDsIdx = maxDs;
            } else if (newCatIdx < categoryIdx) {
                newDsIdx = 0;
            } else {
                newDsIdx = key === keys.ArrowUp
                    ? datasetIdx === minDs ? maxDs : datasetIdx - 1
                    : datasetIdx === maxDs ? minDs : datasetIdx + 1;
            }
        } else {
            newDsIdx = 0;
        }
        return [ newCatIdx, newDsIdx ]; 
    }

    private handleDateOptionClick = (opt: DateBoundary) => {
        const { handleDateSelect } = this.props;
        handleDateSelect(opt);
    }

    private handleDatasetOptionClick = (categoryIdx: number, datasetIdx: number) => {
        const { handleDatasetSelect } = this.props;
        handleDatasetSelect(categoryIdx, datasetIdx);
    }

    private setDatasetOptionClass = (catIdx: number, dsIdx: number) => {
        const { categoryIdx, datasetIdx, className } = this.props;
        return `${className}-select-dataset-option ${catIdx === categoryIdx && dsIdx === datasetIdx ? 'selected' : ''}`;
    }

    private setDateOptionClass = (date: DateBoundary) => {
        const { className, selectedDates } = this.props;
        return `${className}-select-date-option ${date === selectedDates ? 'selected' : ''}`
    }

    private handleDatasetRequest = () => {
        const { datasets, categoryIdx, datasetIdx, selectedDates, dispatch, handleDatasetSelect } = this.props;
        const cat = datasets.available[categoryIdx];
        const ds = cat ? cat.datasets[datasetIdx] : undefined;

        if (ds) {
            dispatch(getPatientListDataset(ds, selectedDates));
            handleDatasetSelect(0,0);
        }
    }
}
