import React from 'react';
import CheckboxTree from './CheckBoxTree/CheckBoxTree';
import {Col, Row, Container, Button} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Gallery from './Gallery/Gallery';
import axios from 'axios';

type SearchTypes = {
  metadata: Array<any>,
  categories: Array<any>
}

type AppState = {
  searchOptions: SearchTypes,
  mediaUnits: Array<any>,
  textFieldSearch: string,
  checkedMetadata: Array<any>,
  checkedCategories: Array<any>,
  error: string,
  uploadFiles: Array<any>
};

class App extends React.Component<{}, AppState> {

  state = {
    searchOptions: {metadata: [], categories: []},
    mediaUnits: [],
    textFieldSearch: "",
    checkedMetadata: [],
    checkedCategories: [],
    error: "",
    uploadFiles: []
  }

  componentDidMount() {
    fetch("http://localhost:3001/gallery")
    .then(res => res.json())
    .then(res => {
      this.setState({
        mediaUnits: res
      })
    })
    .catch(err => this.setState({error: err}))

    fetch("http://localhost:3001/search/menu")
    .then(res => res.json())
    .then(res => {
      this.setState({
        searchOptions: res
      })
    })
    .catch(err => this.setState({error: err}))
  }

  onTextFieldSearchHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = event.target.value;
    this.setState({textFieldSearch: searchTerm}, this.getGallery);
    // this.updateGallery();
  }

  onMetadataSearchHandler = (checked: Array<any>) => {
    this.setState({checkedMetadata: checked}, this.getGallery);
    // this.updateGallery();
  }

  onCategorySearchHandler = (checked: Array<any>) => {
    this.setState({checkedCategories: checked}, this.getGallery);
    // this.updateGallery();
  }

  onFileManagerButtonClick = () => {
    const displayedFilepaths = this.state.mediaUnits.map((m: any) => m.filePath);
    
    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(displayedFilepaths)
    }

    fetch("http://localhost:3001/display", requestOptions);
  }

  onFilesUploadBrowseHandler = (event: any) => {
    this.setState({
      uploadFiles: event.target.files
    })
  }

  onFilesUploadClickHandler = () => {
    const data = new FormData();
    const files = this.state.uploadFiles;

    for (let i=0; i < files.length; i++) {
      data.append('file', files[i]);
    }

    axios.post("http://localhost:3001/upload", data, {

    }).then(res => {
      console.log(res.statusText);
    })

  }

  getGallery = () => {

    let body = {
      textField: this.state.textFieldSearch,
      metadata: this.state.checkedMetadata,
      categories: this.state.checkedCategories
    };

    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    }

    fetch("http://localhost:3001/gallery/search", requestOptions)
    .then(res => res.json())
    .then(res => this.setState({mediaUnits: res}))
  }

  render() {

    let error = null;

    // SEARCH MENU

    // search text
    let searchBar = (
      <div>
        <input 
            type="text" 
            value={this.state.textFieldSearch}
            placeholder="search something ... "
            onChange={this.onTextFieldSearchHandler}
        />
      </div>
    );

    let openInFileManager= (
      <div>
        <Button 
          variant="dark"
          onClick={this.onFileManagerButtonClick}
        >
          Show in File Manager
        </Button>{' '}
      </div>
    )

    // error message
    if (this.state.error) {
      error = (
        <div>
          <p>{error}</p>
        </div>
      )
    }

    // checkboxes
    const searchMenuData = this.state.searchOptions;
    let metadataSearchMenu = null;
    let categoriesSearchMenu = null;
    if (searchMenuData) {
       metadataSearchMenu = searchMenuData["metadata"] ? 
       (
        <React.Fragment>
          <CheckboxTree 
            nodes={searchMenuData["metadata"]} 
            onlyLeafCheckboxes={true}
            checkHandler={this.onMetadataSearchHandler}
          />
        </React.Fragment>
       ) 
       : 
       null;
       categoriesSearchMenu = searchMenuData["categories"] ? 
       (
        <React.Fragment>
          <CheckboxTree 
            nodes={searchMenuData["categories"]} 
            onlyLeafCheckboxes={false}
            checkHandler={this.onCategorySearchHandler}
          />
        </React.Fragment>
       ) 
       : 
       null;
    }

    const filesUpload = (
      <React.Fragment>
        <input type="file" className="form-control" multiple onChange={this.onFilesUploadBrowseHandler}/>
        <button type="button" className="btn btn-success btn-block" onClick={this.onFilesUploadClickHandler}>Upload</button> 
      </React.Fragment>
    );

    return (
      <Container fluid>
        <Row>{error}</Row>
        <Row className="border-bottom">
          <Col sm={3}>
            <h1 className="d-flex justify-content-center">Search Menu</h1>
          </Col>
          <Col sm={9}>
            <h1 className="d-flex justify-content-center">Gallery</h1>
          </Col>
        </Row> 
        <Row>
          <Col sm={3} className="border-right">
            <br></br>
              {searchBar}
            <br></br>
              {filesUpload}
            <br></br>
              {openInFileManager}
            <br></br>
              <h4>Metadata</h4>
                {metadataSearchMenu}
              <h4>Categories</h4>
                {categoriesSearchMenu}
          </Col>
          <Col sm={9}>
            <Gallery 
              mediaUnits={this.state.mediaUnits}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;