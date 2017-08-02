import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import $ from 'jquery';
import color from "@cdo/apps/util/color";
import SectionTable from './SectionTable';
import RosterDialog from './RosterDialog';
import Button from '@cdo/apps/templates/Button';
import {
  newSection,
  beginEditingNewSection,
  beginEditingSection,
  asyncLoadSectionData,
} from './teacherSectionsRedux';
import {loadClassroomList, importClassroomStarted} from './oauthClassroomRedux';
import {classroomShape, loadErrorShape, OAuthSectionTypes} from './shapes';
import i18n from '@cdo/locale';
import experiments, {SECTION_FLOW_2017} from '@cdo/apps/util/experiments';
import AddSectionDialog from "./AddSectionDialog";
import EditSectionDialog from "./EditSectionDialog";

const urlByProvider = {
  [OAuthSectionTypes.google_classroom]: '/dashboardapi/import_google_classroom',
  [OAuthSectionTypes.clever]: '/dashboardapi/import_clever_classroom',
};

const styles = {
  breadcrumb: {
    marginTop: 20,
    marginBottom: 28
  },
  button: {
    marginBottom: 20,
    marginRight: 5,
  }
};

class SectionsPage extends Component {
  static propTypes = {
    teacherHomepage: PropTypes.bool,
    className: PropTypes.string,

    // redux provided
    numSections: PropTypes.number.isRequired,
    studioUrl: PropTypes.string.isRequired,
    provider: PropTypes.string,
    classrooms: PropTypes.arrayOf(classroomShape),
    loadError: loadErrorShape,
    asyncLoadComplete: PropTypes.bool.isRequired,
    newSection: PropTypes.func.isRequired,
    loadClassroomList: PropTypes.func.isRequired,
    importClassroomStarted: PropTypes.func.isRequired,
    beginEditingNewSection: PropTypes.func.isRequired,
    beginEditingSection: PropTypes.func.isRequired,
    asyncLoadSectionData: PropTypes.func.isRequired,
  };

  defaultProps = {
    teacherHomepage: false,
  };

  state = {
    rosterDialogOpen: false,
  };

  componentWillMount() {
    if (experiments.isEnabled('importClassroom')) {
      this.provider = this.props.provider;
    }
  }

  handleImportOpen = () => {
    this.setState({rosterDialogOpen: true});
    this.props.loadClassroomList(this.provider);
  };

  handleImportCancel = () => {
    this.setState({rosterDialogOpen: false});
  };

  handleImport = courseId => {
    this.props.importClassroomStarted();

    const url = urlByProvider[this.provider];
    $.getJSON(url, { courseId }).then(() => {
      this.setState({rosterDialogOpen: false});
      this.props.asyncLoadSectionData();
    });
  };

  addSection = () => {
    if (experiments.isEnabled(SECTION_FLOW_2017)) {
      this.props.beginEditingNewSection();
    } else {
      return this.props.newSection();
    }
  };

  handleEditRequest = section => {
    if (experiments.isEnabled(SECTION_FLOW_2017)) {
      this.props.beginEditingSection(section.id);
    }
  };

  render() {
    const { numSections, asyncLoadComplete } = this.props;

    const newSectionFlow = experiments.isEnabled(SECTION_FLOW_2017);
    const showGoogleClassroom = !newSectionFlow && this.provider === OAuthSectionTypes.google_classroom;
    const showCleverClassroom = !newSectionFlow && this.provider === OAuthSectionTypes.clever;
    return (
      <div className={this.props.className}>
        {!this.props.teacherHomepage &&
          <div style={styles.breadcrumb}>
            <a href="/teacher-dashboard#/">
              {i18n.teacherHomePage()}
            </a>
            <span style={{opacity: 0.5}}>{"\u00a0 \u25b6 \u00a0"}</span>
            <b style={{color: color.dark_orange}}>
              {i18n.studentAccountsAndProgress()}
            </b>
          </div>
        }
        {asyncLoadComplete &&
          <Button
            className="uitest-newsection"
            text={i18n.newSection()}
            style={styles.button}
            onClick={this.addSection}
            color={Button.ButtonColor.gray}
          />
        }
        {asyncLoadComplete && showGoogleClassroom &&
          <Button
            text={i18n.importFromGoogleClassroom()}
            style={styles.button}
            onClick={this.handleImportOpen}
            color={Button.ButtonColor.gray}
          />
        }
        {asyncLoadComplete && showCleverClassroom &&
          <Button
            text={i18n.importFromClever()}
            style={styles.button}
            onClick={this.handleImportOpen}
            color={Button.ButtonColor.gray}
          />
        }
        {asyncLoadComplete && numSections === 0 &&
          <div className="jumbotron">
            <p>{i18n.createSectionsInfo()}</p>
          </div>
        }
        {asyncLoadComplete && numSections > 0 && <SectionTable onEdit={this.handleEditRequest}/>}
        <RosterDialog
          isOpen={this.state.rosterDialogOpen}
          handleImport={this.handleImport}
          handleCancel={this.handleImportCancel}
          classrooms={this.props.classrooms}
          loadError={this.props.loadError}
          studioUrl={this.props.studioUrl}
          provider={this.provider}
        />
        <AddSectionDialog handleImportOpen={this.handleImportOpen}/>
        <EditSectionDialog/>
      </div>
    );
  }
}
export const UnconnectedSectionsPage = SectionsPage;

export default connect(state => ({
  numSections: state.teacherSections.sectionIds.length,
  studioUrl: state.teacherSections.studioUrl,
  provider: state.teacherSections.provider,
  classrooms: state.oauthClassroom.classrooms,
  loadError: state.oauthClassroom.loadError,
  asyncLoadComplete: state.teacherSections.asyncLoadComplete,
}), {
  newSection,
  beginEditingNewSection,
  beginEditingSection,
  loadClassroomList,
  importClassroomStarted,
  asyncLoadSectionData,
})(SectionsPage);
