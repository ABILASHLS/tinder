import { take, call, put, select, fork, cancel } from 'redux-saga/effects';
import { takeLatest, takeEvery } from 'redux-saga';
import { LOCATION_CHANGE } from 'react-router-redux';
import { AUTH_URL } from 'global_constants';

import {
  FETCH_TINDER_DATA,
  FETCH_MATCHES,
  REMOVE_MATCH,
} from './constants';

import {
  fetchTinderDataSuccess,
  fetchTinderDataError,
  fetchMatchesSuccess,
  fetchMatchesError,
} from './actions';

import {
  selectFacebookToken,
  selectAuthToken,
} from 'containers/Auth/selectors';
import { selectMatches } from 'containers/Matches/selectors';
import { postRequest } from 'utils/request';

export function* getTinderData() {
  const token = yield select(selectFacebookToken());
  const postURL = `${AUTH_URL}/tinder/data`;

  const data = yield call(postRequest, postURL, { token });

  if (data.status === 200) {
    yield put(fetchTinderDataSuccess((data.data)));
  } else {
    yield put(fetchTinderDataError(data.data.errors));
  }
}

export function* fetchMatchesAction() {
  const authToken = yield select(selectAuthToken());
  const postURL = `${AUTH_URL}/tinder/matches`;
  const data = yield call(postRequest, postURL, { authToken });
  if (data.status === 200 && data.data.length !== 0) {
    const currentMatches = yield select(selectMatches());
    const filteredNewMatches = data.data.filter((each) => {
      let flag = true;
      let counter = 0;
      for (; counter < currentMatches.length; counter++) {
        if (currentMatches[counter]._id === each._id) { // eslint-disable-line no-underscore-dangle
          flag = false;
        }
      }
      return flag;
    });
    yield put(fetchMatchesSuccess(currentMatches.concat(filteredNewMatches)));
  } else {
    yield put(fetchMatchesError(data.data || 'Error Fetching Matches'));
  }
}


// Individual exports for testing
export function* dashboardSaga() {
  const watcher = [
    yield fork(takeLatest, FETCH_TINDER_DATA, getTinderData),
    yield fork(takeLatest, FETCH_MATCHES, fetchMatchesAction),
  ];

  // yield fork(takeEvery, REMOVE_MATCH, removeMatchAction);

  yield take(LOCATION_CHANGE);
  yield watcher.map(each => cancel(each));
}

// All sagas to be loaded
export default [
  dashboardSaga,
];
