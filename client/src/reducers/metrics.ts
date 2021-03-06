import { normalize } from 'normalizr';
import { Reducer } from 'redux';

import * as _ from 'lodash';

import { actionTypes, MetricsAction } from '../actions/metrics';
import { ACTIONS } from '../constants/actions';
import { MetricSchema } from '../constants/schemas';
import { AlertEmptyState, AlertSchema, processErrorGlobal } from '../models/alerts';
import {
  LoadingIndicatorEmptyState,
  LoadingIndicatorSchema,
  processLoadingIndicatorGlobal
} from '../models/loadingIndicator';
import { MetricEmptyState, MetricModel, MetricStateSchema } from '../models/metric';
import { LastFetchedIds } from '../models/utils';

export const MetricsReducer: Reducer<MetricStateSchema> =
  (state: MetricStateSchema = MetricEmptyState, action: MetricsAction) => {
    let newState = {...state};

    const processMetric = (metric: MetricModel) => {
      const id = metric.id;
      newState.lastFetched.ids.push(id);
      if (!_.includes(newState.ids, id)) {
        newState.ids.push(id);
      }
      const normalizedMetrics = normalize(metric, MetricSchema).entities.metrics;
      newState.byIds[id] = {
        ...newState.byIds[id], ...normalizedMetrics[id]
      };
      return newState;
    };

    switch (action.type) {
      case actionTypes.FETCH_METRICS_REQUEST:
        newState.lastFetched = new LastFetchedIds();
        return newState;
      case actionTypes.FETCH_METRICS_SUCCESS:
        newState.lastFetched = new LastFetchedIds();
        newState.lastFetched.count = action.count;
        for (const build of action.metrics) {
          newState = processMetric(build);
        }
        return newState;
      default:
        return state;
    }
  };

export const LoadingIndicatorMetricReducer: Reducer<LoadingIndicatorSchema> =
  (state: LoadingIndicatorSchema = LoadingIndicatorEmptyState, action: MetricsAction) => {
    switch (action.type) {
      case actionTypes.FETCH_METRICS_REQUEST:
        return {
          ...state,
          metrics: processLoadingIndicatorGlobal(state.metrics, true, ACTIONS.FETCH)
        };
      case actionTypes.FETCH_METRICS_ERROR:
      case actionTypes.FETCH_METRICS_SUCCESS:
        return {
          ...state,
          metrics: processLoadingIndicatorGlobal(state.metrics, false, ACTIONS.FETCH)
        };
      default:
        return state;
    }
  };

export const AlertMetricReducer: Reducer<AlertSchema> =
  (state: AlertSchema = AlertEmptyState, action: MetricsAction) => {
    switch (action.type) {
      case actionTypes.FETCH_METRICS_REQUEST:
        return {
          ...state,
          metrics: processErrorGlobal(state.metrics, null, null, ACTIONS.FETCH)
        };
      case actionTypes.FETCH_METRICS_SUCCESS:
        return {
          ...state,
          metrics: processErrorGlobal(state.metrics, null, true, ACTIONS.FETCH)
        };
      case actionTypes.FETCH_METRICS_ERROR:
        return {
          ...state,
          metrics: processErrorGlobal(state.metrics, action.error, false, ACTIONS.FETCH)
        };
      default:
        return state;
    }
  };
